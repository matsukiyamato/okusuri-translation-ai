from fastapi import FastAPI

app = FastAPI(title="お薬翻訳AI Backend")

@app.get("/")
def read_root():
    return {"message": "Okusuri Translation AI API is running"}
