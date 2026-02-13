package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/opentracing/opentracing-go"
	"github.com/opentracing/opentracing-go/ext"
)

// TracingMiddleware creates a span per incoming request.
func TracingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tracer := opentracing.GlobalTracer()
		var span opentracing.Span

		path := c.FullPath()
		if path == "" {
			path = c.Request.URL.Path
		}

		spanContext, err := tracer.Extract(opentracing.HTTPHeaders, opentracing.HTTPHeadersCarrier(c.Request.Header))
		if err == nil {
			span = tracer.StartSpan(c.Request.Method+" "+path, ext.RPCServerOption(spanContext))
		} else {
			span = tracer.StartSpan(c.Request.Method + " " + path)
		}

		ext.Component.Set(span, "gin")
		ext.HTTPMethod.Set(span, c.Request.Method)
		ext.HTTPUrl.Set(span, c.Request.URL.String())

		c.Request = c.Request.WithContext(opentracing.ContextWithSpan(c.Request.Context(), span))

		c.Next()

		statusCode := c.Writer.Status()
		ext.HTTPStatusCode.Set(span, uint16(statusCode))
		if statusCode >= http.StatusInternalServerError {
			ext.Error.Set(span, true)
		}

		span.Finish()
	}
}
