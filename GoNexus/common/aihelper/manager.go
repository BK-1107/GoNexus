package aihelper

import (
	"context"
	"sync"
)

var ctx = context.Background()

// AIHelperManager AI鍔╂墜绠＄悊鍣紝绠＄悊鐢ㄦ埛-浼氳瘽-AIHelper鐨勬槧灏勫叧绯?
type AIHelperManager struct {
	helpers map[string]map[string]*AIHelper // map[鐢ㄦ埛璐﹀彿锛堝敮涓€锛塢map[浼氳瘽ID]*AIHelper
	mu      sync.RWMutex
}

// NewAIHelperManager 鍒涘缓鏂扮殑绠＄悊鍣ㄥ疄渚?
func NewAIHelperManager() *AIHelperManager {
	return &AIHelperManager{
		helpers: make(map[string]map[string]*AIHelper),
	}
}

// 鑾峰彇鎴栧垱寤篈IHelper
func (m *AIHelperManager) GetOrCreateAIHelper(userName string, sessionID string, modelType string, config map[string]interface{}) (*AIHelper, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// 鑾峰彇鐢ㄦ埛鐨勪細璇濇槧灏?
	userHelpers, exists := m.helpers[userName]
	if !exists {
		userHelpers = make(map[string]*AIHelper)
		m.helpers[userName] = userHelpers
	}

	// [淇] 缂撳瓨閿鍔?modelType锛岀‘淇濇ā寮忓垏鎹㈡湁鏁?
	cacheKey := sessionID + "_" + modelType

	// 妫€鏌ヤ細璇濇槸鍚﹀凡瀛樺湪
	helper, exists := userHelpers[cacheKey]
	if exists {
		return helper, nil
	}

	// 鍒涘缓鏂扮殑AIHelper
	factory := GetGlobalFactory()
	helper, err := factory.CreateAIHelper(ctx, modelType, sessionID, config)
	if err != nil {
		return nil, err
	}

	userHelpers[cacheKey] = helper
	return helper, nil
}

// 鑾峰彇鎸囧畾鐢ㄦ埛鐨勬寚瀹氫細璇濈殑AIHelper
func (m *AIHelperManager) GetAIHelper(userName string, sessionID string) (*AIHelper, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	userHelpers, exists := m.helpers[userName]
	if !exists {
		return nil, false
	}

	for _, helper := range userHelpers {
		if helper.SessionID == sessionID {
			return helper, true
		}
	}

	return nil, false
}

// 绉婚櫎鎸囧畾鐢ㄦ埛鐨勬寚瀹氫細璇濈殑AIHelper
func (m *AIHelperManager) RemoveAIHelper(userName string, sessionID string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	userHelpers, exists := m.helpers[userName]
	if !exists {
		return
	}

	for key, helper := range userHelpers {
		if helper.SessionID == sessionID {
			delete(userHelpers, key)
		}
	}

	// 濡傛灉鐢ㄦ埛娌℃湁浼氳瘽浜嗭紝娓呯悊鐢ㄦ埛鏄犲皠
	if len(userHelpers) == 0 {
		delete(m.helpers, userName)
	}
}

// 鑾峰彇鎸囧畾鐢ㄦ埛鐨勬墍鏈変細璇滻D
func (m *AIHelperManager) RemoveMessageFromSession(userName string, sessionID string, messageID uint) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	userHelpers, exists := m.helpers[userName]
	if !exists {
		return
	}

	for _, helper := range userHelpers {
		if helper.SessionID == sessionID {
			helper.RemoveMessageByID(messageID)
		}
	}
}

func (m *AIHelperManager) UpdateMessageInSession(userName string, sessionID string, messageID uint, content string) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	userHelpers, exists := m.helpers[userName]
	if !exists {
		return
	}

	for _, helper := range userHelpers {
		if helper.SessionID == sessionID {
			helper.UpdateMessageContentByID(messageID, content)
		}
	}
}
func (m *AIHelperManager) GetUserSessions(userName string) []string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	userHelpers, exists := m.helpers[userName]
	if !exists {
		return []string{}
	}

	sessionIDs := make([]string, 0, len(userHelpers))
	//鍙栧嚭鎵€鏈夌殑key
	for sessionID := range userHelpers {
		sessionIDs = append(sessionIDs, sessionID)
	}

	return sessionIDs
}

// 鍏ㄥ眬绠＄悊鍣ㄥ疄渚?
var globalManager *AIHelperManager
var once sync.Once

// GetGlobalManager 鑾峰彇鍏ㄥ眬绠＄悊鍣ㄥ疄渚?
func GetGlobalManager() *AIHelperManager {
	once.Do(func() {
		globalManager = NewAIHelperManager()
	})
	return globalManager
}
