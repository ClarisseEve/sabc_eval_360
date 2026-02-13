package config

import (
	"fmt"
	"strings"
	"time"

	"github.com/spf13/viper"
)

// Config holds all application configuration.
type Config struct {
	Server     ServerConfig
	ClickHouse ClickHouseConfig
	Auth       AuthConfig
	Tracing    TracingConfig
	Logging    LoggingConfig
}

// ServerConfig holds HTTP server configuration.
type ServerConfig struct {
	HTTPPort     int           `mapstructure:"http_port"`
	ReadTimeout  time.Duration `mapstructure:"read_timeout"`
	WriteTimeout time.Duration `mapstructure:"write_timeout"`
	IdleTimeout  time.Duration `mapstructure:"idle_timeout"`
	Environment  string        `mapstructure:"environment"`
}

// ClickHouseConfig holds ClickHouse configuration.
type ClickHouseConfig struct {
	Host            string        `mapstructure:"host"`
	Port            int           `mapstructure:"port"`
	Database        string        `mapstructure:"database"`
	Username        string        `mapstructure:"username"`
	Password        string        `mapstructure:"password"`
	DialTimeout     time.Duration `mapstructure:"dial_timeout"`
	MaxOpenConns    int           `mapstructure:"max_open_conns"`
	MaxIdleConns    int           `mapstructure:"max_idle_conns"`
	ConnMaxLifetime time.Duration `mapstructure:"conn_max_lifetime"`
}

// Addr returns the ClickHouse address.
func (c ClickHouseConfig) Addr() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

// AuthConfig holds service-to-service authentication configuration.
type AuthConfig struct {
	ServiceKey string `mapstructure:"service_key"`
}

// TracingConfig holds Jaeger tracing configuration.
type TracingConfig struct {
	Enabled     bool   `mapstructure:"enabled"`
	ServiceName string `mapstructure:"service_name"`
	AgentHost   string `mapstructure:"agent_host"`
	AgentPort   int    `mapstructure:"agent_port"`
}

// LoggingConfig holds logging configuration.
type LoggingConfig struct {
	Level  string `mapstructure:"level"`
	Format string `mapstructure:"format"`
}

// Load loads configuration from environment and config files.
func Load() (*Config, error) {
	v := viper.New()

	setDefaults(v)

	v.SetEnvPrefix("ANALYTICS")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath("/etc/analytics-service/")
	v.AddConfigPath("./config/")
	v.AddConfigPath(".")

	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
	}

	var config Config
	if err := v.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("error unmarshaling config: %w", err)
	}

	return &config, nil
}

func setDefaults(v *viper.Viper) {
	v.SetDefault("server.http_port", 8080)
	v.SetDefault("server.read_timeout", 30*time.Second)
	v.SetDefault("server.write_timeout", 30*time.Second)
	v.SetDefault("server.idle_timeout", 120*time.Second)
	v.SetDefault("server.environment", "development")

	v.SetDefault("clickhouse.host", "clickhouse")
	v.SetDefault("clickhouse.port", 9000)
	v.SetDefault("clickhouse.database", "sabc_analytics")
	v.SetDefault("clickhouse.username", "default")
	v.SetDefault("clickhouse.password", "")
	v.SetDefault("clickhouse.dial_timeout", 5*time.Second)
	v.SetDefault("clickhouse.max_open_conns", 10)
	v.SetDefault("clickhouse.max_idle_conns", 5)
	v.SetDefault("clickhouse.conn_max_lifetime", 5*time.Minute)

	v.SetDefault("auth.service_key", "internal-service-key")

	v.SetDefault("tracing.enabled", true)
	v.SetDefault("tracing.service_name", "analytics-service")
	v.SetDefault("tracing.agent_host", "jaeger")
	v.SetDefault("tracing.agent_port", 6831)

	v.SetDefault("logging.level", "info")
	v.SetDefault("logging.format", "json")
}
