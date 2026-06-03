package myjwt

import (
	"GoNexus/config"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

// Claims 定义了 JWT token 中包含的用户信息和标准字段。
type Claims struct {
	ID                   int64  `json:"id"`
	Username             string `json:"username"`
	jwt.RegisteredClaims        //放jwt标准字段，如过期时间、签发人等
}

// GenerateToken 根据用户 ID 和用户名生成 JWT token。
func GenerateToken(id int64, username string) (string, error) {
	claims := Claims{
		ID:       id,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(config.GetConfig().ExpireDuration) * time.Hour)),
			Issuer:    config.GetConfig().Issuer,
			Subject:   config.GetConfig().Subject,
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	// 生成 token, HS256 签名算法,创建三段式的前2：header.payload.signature
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	// 使用配置中的密钥进行签名，生成最终的 token 字符串。
	return token.SignedString([]byte(config.GetConfig().Key))
}

// ParseToken 解析Token，成功返回用户名和true，失败返回空字符串和false。
func ParseToken(token string) (string, bool) {
	// 解析 token 时使用 Claims 当容器来接收解析结果。
	claims := new(Claims)
	t, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (interface{}, error) {
		return []byte(config.GetConfig().Key), nil // 解析时提供密钥，供库验证签名用。
	})
	// 解析失败或 token 无效（如过期），返回 false。
	if err != nil || t == nil || !t.Valid {
		return "", false
	}
	return claims.Username, true
}
