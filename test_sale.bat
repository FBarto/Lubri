@echo off
curl -v -X POST http://localhost:3000/api/sales ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\": 1, \"clientId\": 577, \"status\": \"PENDING\", \"items\": [{\"type\": \"PRODUCT\", \"id\": 615, \"description\": \"Filtro de Aire AMP 339\", \"quantity\": 1, \"unitPrice\": 127032}]}"
