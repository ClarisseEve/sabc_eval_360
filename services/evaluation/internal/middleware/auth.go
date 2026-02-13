package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// AuthMiddleware handles JWT authentication
type AuthMiddleware struct {
	logger    *zap.Logger
	jwtSecret string
}

// NewAuthMiddleware creates a new auth middleware
func NewAuthMiddleware(jwtSecret string, logger *zap.Logger) *AuthMiddleware {
	return &AuthMiddleware{
		jwtSecret: jwtSecret,
		logger:    logger,
	}
}

// Authenticate validates JWT tokens
func (m *AuthMiddleware) Authenticate() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "UNAUTHORIZED",
					"message": "Token d'authentification manquant",
				},
			})
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INVALID_TOKEN",
					"message": "Format de token invalide",
				},
			})
			return
		}

		token := parts[1]

		// Validate JWT token and extract claims
		claims, err := m.validateToken(token)
		if err != nil {
			m.logger.Warn("token validation failed", zap.Error(err))
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INVALID_TOKEN",
					"message": "Token invalide ou expiré",
				},
			})
			return
		}

		// Set user context
		c.Set("user_matricule", claims.Matricule)
		c.Set("user_role", claims.Role)
		c.Set("user_id", claims.UserID)

		c.Next()
	}
}

// Claims represents JWT claims
type Claims struct {
	UserID    string `json:"user_id"`
	Matricule string `json:"matricule"`
	Role      string `json:"role"`
	Email     string `json:"email"`
}

// validateToken validates and parses a JWT token
func (m *AuthMiddleware) validateToken(tokenString string) (*Claims, error) {
	// TODO: Implement proper JWT validation
	// For now, this is a placeholder that would integrate with Laravel's JWT

	// In production, this would:
	// 1. Parse the JWT using the shared secret
	// 2. Validate signature
	// 3. Check expiration
	// 4. Extract claims

	// Placeholder for development - extract from Laravel Sanctum token
	// This would need to verify against Laravel's token storage

	return &Claims{
		UserID:    "1",
		Matricule: "DEV001",
		Role:      "Admin",
	}, nil
}

// RequireRole middleware checks if user has required role
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole := c.GetString("user_role")

		for _, role := range roles {
			if userRole == role {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "FORBIDDEN",
				"message": "Rôle insuffisant pour cette action",
			},
		})
	}
}

// InternalServiceAuth middleware for service-to-service communication
func InternalServiceAuth(serviceKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.GetHeader("X-Service-Key")
		if key != serviceKey {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "UNAUTHORIZED",
					"message": "Clé de service invalide",
				},
			})
			return
		}
		c.Next()
	}
}
