import google.generativeai as genai
API_KEY = "AIzaSyC_qWvN4V5fI7XHV6TmueyCdDBEGqrxccc"

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")
chat = model.start_chat()

while True:
    userInput = input("Você: ")
    if userInput.lower() == "sair":
        print("Saindo do chat...")
        break
    reposta = chat.send_message(userInput)
    print(f"Gemini: {reposta.text}")