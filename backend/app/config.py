from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    openai_api_key: str
    anthropic_api_key: str = ""
    apify_api_token: str
    cron_day_of_week: str = "sun"
    cron_hour: int = 2
    render_external_url: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
