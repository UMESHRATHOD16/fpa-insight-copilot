from fastapi import FastAPI

app = FastAPI(
    title="FP&A Insight Copilot",
    description="AI-powered financial analysis assistant",
)


@app.get("/")
def home():
    return {"message": "FP&A Insight Copilot API is running!"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
