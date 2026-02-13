package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// InternalServiceAuth validates the service-to-service key.
func InternalServiceAuth(serviceKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if serviceKey == "" {
			c.Next()
			return
		}

		key := c.GetHeader("X-Service-Key")
		if key != serviceKey {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "UNAUTHORIZED",
					"message": "Cle de service invalide",
				},
			})
			return
		}

		c.Next()
	}
}
