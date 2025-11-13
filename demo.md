### A - Pegar o Token do Professor

Método: POST

Link: http://localhost:3000/api/login

Body (JSON):

{
  "email": "prof@email.com",
  "senha": "123"
}


### B - Registrar a Falta (Simulando o Botão "Ausente")

Método: POST

Link: http://localhost:3000/registrar-falta

Headers:

Content-Type: application/json

Authorization: Bearer _TOKEN

{
  "alunoId": (ID_Mostrado),
  "dataFalta": "2025-11-13",
  "professorId": (ID_Mostrado),
  "pontosDeduzidos": 20,
  "motivo": "Simulação de falta ao vivo na demo"
}