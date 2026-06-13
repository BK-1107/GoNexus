package rag

import "strings"

const (
	// defaultChunkSize 控制每个 chunk 的最大长度。
	defaultChunkSize = 800

	// defaultChunkOverlap 控制相邻 chunk 之间保留多少上下文。
	defaultChunkOverlap = 100
)

// splitText 将一篇文档切成多个适合向量化和检索的 chunk。
func splitText(text string, chunkSize, overlap int) []string {
	text = strings.TrimSpace(text)
	if text == "" {
		return nil
	}

	if chunkSize <= 0 {
		chunkSize = defaultChunkSize
	}
	if overlap < 0 {
		overlap = 0
	}
	if overlap >= chunkSize {
		// overlap 不能大于等于 chunkSize，否则切长段落时 step 会小于等于 0。
		overlap = chunkSize / 4
	}

	paragraphs := splitParagraphs(text)
	chunks := make([]string, 0, len(paragraphs))
	current := ""

	for _, paragraph := range paragraphs {
		if runeLen(paragraph) > chunkSize {
			// 当前正在累积的短段落先收尾，再单独处理这个超长段落。
			if strings.TrimSpace(current) != "" {
				chunks = append(chunks, strings.TrimSpace(current))
				current = ""
			}
			chunks = append(chunks, splitLongParagraph(paragraph, chunkSize, overlap)...)
			continue
		}

		if current == "" {
			// 当前 chunk 为空时，直接用当前段落作为起点。
			current = paragraph
			continue
		}

		candidate := current + "\n\n" + paragraph
		if runeLen(candidate) <= chunkSize {
			// 拼上这个段落后仍然没超过长度限制，就继续累积。
			current = candidate
			continue
		}

		// 再拼就会超长，先保存当前 chunk，再从当前段落开始新 chunk。
		chunks = append(chunks, strings.TrimSpace(current))
		current = paragraph
	}

	if strings.TrimSpace(current) != "" {
		chunks = append(chunks, strings.TrimSpace(current))
	}

	return addChunkOverlap(chunks, overlap)
}

// splitParagraphs 把文本拆成段落。
// 这里优先按空行拆，没有空行，再按普通换行拆
func splitParagraphs(text string) []string {
	normalized := strings.ReplaceAll(text, "\r\n", "\n")
	normalized = strings.ReplaceAll(normalized, "\r", "\n")

	blocks := strings.Split(normalized, "\n\n")
	if len(blocks) == 1 {
		blocks = strings.Split(normalized, "\n")
	}

	paragraphs := make([]string, 0, len(blocks))
	for _, block := range blocks {
		block = strings.TrimSpace(block)
		if block != "" {
			paragraphs = append(paragraphs, block)
		}
	}
	return paragraphs
}

// splitLongParagraph 处理超过 chunkSize 的长段落。
func splitLongParagraph(paragraph string, chunkSize, overlap int) []string {
	runes := []rune(strings.TrimSpace(paragraph))
	if len(runes) == 0 {
		return nil
	}

	step := chunkSize - overlap
	chunks := make([]string, 0, len(runes)/step+1)
	for start := 0; start < len(runes); start += step {
		end := start + chunkSize
		if end > len(runes) {
			end = len(runes)
		}

		chunk := strings.TrimSpace(string(runes[start:end]))
		if chunk != "" {
			chunks = append(chunks, chunk)
		}
		if end == len(runes) {
			break
		}
	}
	return chunks
}

// addChunkOverlap 给相邻 chunk 补一点上下文。
func addChunkOverlap(chunks []string, overlap int) []string {
	if overlap <= 0 || len(chunks) < 2 {
		return chunks
	}

	result := make([]string, 0, len(chunks))
	for i, chunk := range chunks {
		if i == 0 {
			result = append(result, chunk)
			continue
		}

		prevRunes := []rune(chunks[i-1])
		start := len(prevRunes) - overlap
		if start < 0 {
			start = 0
		}

		prefix := strings.TrimSpace(string(prevRunes[start:]))
		if prefix == "" {
			result = append(result, chunk)
			continue
		}

		result = append(result, prefix+"\n\n"+chunk)
	}
	return result
}

// runeLen 返回字符串的 rune 数量。
// 在这里它用于近似衡量中文文本长度，比 len(text) 的字节数更适合做切分。
func runeLen(text string) int {
	return len([]rune(text))
}
