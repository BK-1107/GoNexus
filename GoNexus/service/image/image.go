package image

import (
	"GoNexus/config"
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
)

type OpenAICompatibleVisionRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

type Message struct {
	Role    string      `json:"role"`
	Content interface{} `json:"content"`
}

type Content struct {
	Type     string    `json:"type"`
	Text     string    `json:"text,omitempty"`
	ImageURL *ImageURL `json:"image_url,omitempty"`
}

type ImageURL struct {
	URL string `json:"url"`
}

type AIResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

type GeneratedPrompt struct {
	Prompt string `json:"prompt"`
}

func RecognizeImage(file *multipart.FileHeader) (string, error) {
	log.Printf("[Backend] Starting AI Vision analysis for: %s", file.Filename)

	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open image: %v", err)
	}
	defer src.Close()

	imgData, err := io.ReadAll(src)
	if err != nil {
		return "", fmt.Errorf("failed to read image data: %v", err)
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	mimeType := "image/jpeg"
	if ext == ".png" {
		mimeType = "image/png"
	} else if ext == ".webp" {
		mimeType = "image/webp"
	}

	dataURL := fmt.Sprintf("data:%s;base64,%s", mimeType, base64.StdEncoding.EncodeToString(imgData))

	conf := config.GetConfig()
	apiKey := conf.GetVisionAPIKey()
	baseURL := conf.GetVisionBaseURL()
	modelID := conf.GetVisionModelID()
	if apiKey == "" || baseURL == "" || modelID == "" {
		return "", fmt.Errorf("AI API key, base URL, or model ID is missing in config")
	}

	reqBody := OpenAICompatibleVisionRequest{
		Model: modelID,
		Messages: []Message{
			{
				Role: "user",
				Content: []Content{
					{
						Type: "text",
						Text: "You are the GoNexus Intelligence Engine. Please analyze this image and provide a concise, professional description of the main objects, colors, and key features. Return the result in pure text.",
					},
					{
						Type: "image_url",
						ImageURL: &ImageURL{
							URL: dataURL,
						},
					},
				},
			},
		},
	}

	content, err := callOpenAICompatibleModel(apiKey, baseURL, reqBody)
	if err != nil {
		return "", err
	}

	return content, nil
}

func GeneratePromptFromAnalysis(analysis string) (GeneratedPrompt, error) {
	analysis = strings.TrimSpace(analysis)
	if analysis == "" {
		return GeneratedPrompt{}, fmt.Errorf("analysis is empty")
	}

	conf := config.GetConfig()
	apiKey := conf.GetChatAPIKey()
	baseURL := conf.GetChatBaseURL()
	modelID := conf.GetChatModelID()
	if apiKey == "" || baseURL == "" || modelID == "" {
		return GeneratedPrompt{}, fmt.Errorf("chat AI API key, base URL, or model ID is missing in config")
	}

	prompt := fmt.Sprintf(`Convert this image analysis into a Stable Diffusion / NovelAI tag prompt.

Rules:
- Output JSON only.
- Use English only.
- Output exactly one field: "prompt".
- The prompt value must be one line of comma-separated short tags.
- Use 20 to 45 tags.
- Each tag must be 1 to 6 words.
- Prefer concrete visual tags over prose.
- Start with the subject/style tags, then composition, colors, materials, text/UI elements, and rendering quality.
- Do not write full sentences.
- Do not start with "A", "An", "The image", "This image", or "The scene".
- Do not include verbs like "displays", "features", "presents", "shows", "contains", or "includes".
- Do not include section labels inside the prompt.
- Do not include keywords fields, negative prompt, parameters, sampler, CFG, lighting sections, markdown, or explanation.
- Preserve the original subject, composition, colors, typography, UI/document/poster nature if present.
- If the image is a UI screenshot, document, slide, or poster, convert it into visual design tags such as "neobrutalist UI", "thick black outlines", "flat interface", "bold sans serif typography", "green accent buttons".
- Keep readable text only when it is visually important, and write it as a short tag such as "GOPHERAI header text" or "IMPORT button label".

Bad output:
A clean software interface screenshot on a white background, it features green buttons and a scrollbar.

Good output:
neobrutalist web app interface, white background, thick black outlines, blocky drop shadows, bold sans serif typography, bright green accent buttons, GOPHERAI header text, green logo icon, home icon button, vertical sidebar navigation, NEW CHAT button label, KNOWLEDGE button label, IMPORT button label, MODE STANDARD status button, chat list cards, trash icon button, right side scrollbar, flat vector UI, high contrast, sharp edges, clean screenshot style

Image analysis:
%s`, analysis)

	reqBody := OpenAICompatibleVisionRequest{
		Model: modelID,
		Messages: []Message{
			{
				Role:    "user",
				Content: prompt,
			},
		},
	}

	content, err := callOpenAICompatibleModel(apiKey, baseURL, reqBody)
	if err != nil {
		return GeneratedPrompt{}, err
	}

	var generated GeneratedPrompt
	cleanContent := strings.TrimSpace(content)
	cleanContent = strings.TrimPrefix(cleanContent, "```json")
	cleanContent = strings.TrimPrefix(cleanContent, "```")
	cleanContent = strings.TrimSuffix(cleanContent, "```")
	cleanContent = strings.TrimSpace(cleanContent)
	if err := json.Unmarshal([]byte(cleanContent), &generated); err != nil {
		return GeneratedPrompt{
			Prompt: buildFallbackPrompt(analysis),
		}, nil
	}

	generated.Prompt = normalizePromptLine(generated.Prompt)
	if generated.Prompt == "" {
		generated.Prompt = buildFallbackPrompt(analysis)
	}
	return generated, nil
}

func callOpenAICompatibleModel(apiKey string, baseURL string, reqBody OpenAICompatibleVisionRequest) (string, error) {
	jsonPayload, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal JSON payload: %v", err)
	}

	apiEndpoint := strings.TrimRight(baseURL, "/") + "/chat/completions"
	req, err := http.NewRequest("POST", apiEndpoint, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return "", fmt.Errorf("failed to create HTTP request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to call AI API: %v", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read API response: %v", err)
	}

	var aiResp AIResponse
	if err := json.Unmarshal(respBody, &aiResp); err != nil {
		log.Printf("Raw API Response: %s", string(respBody))
		return "", fmt.Errorf("failed to parse AI response JSON: %v", err)
	}

	if aiResp.Error != nil {
		return "", fmt.Errorf("AI API Error: %s", aiResp.Error.Message)
	}

	if len(aiResp.Choices) > 0 {
		return aiResp.Choices[0].Message.Content, nil
	}

	return "", fmt.Errorf("no result generated by AI model")
}

func normalizePromptLine(value string) string {
	value = strings.ReplaceAll(value, "\n", ", ")
	value = strings.Join(strings.Fields(value), " ")
	value = strings.Trim(value, " ,")
	return value
}

func buildFallbackPrompt(analysis string) string {
	words := strings.Fields(analysis)
	if len(words) > 28 {
		words = words[:28]
	}
	keywords := normalizePromptLine(strings.Join(words, ", "))
	if keywords == "" {
		return "clean visual composition, high detail, sharp focus"
	}
	return "high quality, sharp focus, clean composition, " + keywords
}
