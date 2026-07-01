 # Coordenadas dos Centros dos Bairros
 
 Este ficheiro documenta as coordenadas utilizadas para deteção de bairros por GPS.
 
 ## Metodologia
 
 - **Raio de deteção:** 2 km do centro do bairro
 - **Fórmula:** Haversine (distância em linha reta)
 - **Fonte de coordenadas:** Google Maps, Wikipedia, OpenStreetMap
 
 ---
 
 ## Luanda, Angola
 
 ### Zona Central
 
 | Bairro | Latitude | Longitude | Fonte | Verificado | Notas |
 |--------|----------|-----------|-------|------------|-------|
 | Mutamba | -8.8147 | 13.2302 | Estimativa | ❌ | Centro histórico |
 | Maianga | -8.8283 | 13.2344 | Estimativa | ❌ | |
 | Maculusso | -8.8225 | 13.2389 | Estimativa | ❌ | |
 | Vila Alice | -8.8308 | 13.2456 | Estimativa | ❌ | |
 | Alvalade | -8.8356 | 13.2522 | Estimativa | ❌ | |
 | Prenda | -8.8419 | 13.2406 | Estimativa | ❌ | |
 | Rocha Pinto | -8.8364 | 13.2267 | Estimativa | ❌ | |
 | Sambizanga | -8.8083 | 13.2411 | Estimativa | ❌ | |
 | Rangel | -8.8217 | 13.2533 | Estimativa | ❌ | |
 | Marçal | -8.8142 | 13.2478 | Estimativa | ❌ | |
 | São Paulo | -8.8194 | 13.2189 | Estimativa | ❌ | |
 
 ### Zona Sul (Talatona)
 
 | Bairro | Latitude | Longitude | Fonte | Verificado | Notas |
 |--------|----------|-----------|-------|------------|-------|
 | Talatona | -8.917 | 13.183 | Wikipedia | ✅ | Município de Talatona |
 | Morro Bento | -8.8954 | 13.2045 | Yandex Maps | ✅ | Morro Bento I |
 | Benfica | -8.8833 | 13.2167 | Estimativa | ❌ | |
 | Camama | -8.8917 | 13.2333 | Estimativa | ❌ | |
 | Kilamba | -9.000 | 13.267 | Wikipedia | ✅ | Centralidade do Kilamba |
 | Lar do Patriota | -8.915 | 13.188 | Ajustado | ✅ | Mesmo que "Patriota" |
 | Golf 2 | -8.8750 | 13.2000 | Estimativa | ❌ | |
 | Zona Verde | -8.8833 | 13.1917 | Estimativa | ❌ | |
 | Gamek | -8.8694 | 13.2028 | Estimativa | ❌ | |
 | Samba | -8.8500 | 13.2167 | Estimativa | ❌ | |
 
 ### Zona Leste
 
 | Bairro | Latitude | Longitude | Fonte | Verificado | Notas |
 |--------|----------|-----------|-------|------------|-------|
 | Cazenga | -8.8000 | 13.2833 | Estimativa | ❌ | |
 | Viana | -8.8833 | 13.3667 | Estimativa | ❌ | |
 | Zango | -8.9333 | 13.3500 | Estimativa | ❌ | |
 | Dangereux | -8.8167 | 13.2667 | Estimativa | ❌ | |
 
 ---
 
 ## Benguela, Angola
 
 | Bairro | Latitude | Longitude | Fonte | Verificado | Notas |
 |--------|----------|-----------|-------|------------|-------|
 | Centro | -12.5763 | 13.4055 | Estimativa | ❌ | |
 | Lobito | -12.3644 | 13.5361 | Estimativa | ❌ | Cidade separada |
 | Catumbela | -12.4319 | 13.5472 | Estimativa | ❌ | |
 | Bairro 11 | -12.5800 | 13.4100 | Estimativa | ❌ | |
 | Bairro da Graça | -12.5750 | 13.4000 | Estimativa | ❌ | |
 
 ---
 
 ## Huambo, Angola
 
 | Bairro | Latitude | Longitude | Fonte | Verificado | Notas |
 |--------|----------|-----------|-------|------------|-------|
 | Centro | -12.7761 | 15.7394 | Estimativa | ❌ | |
 | Caála | -12.8500 | 15.5667 | Estimativa | ❌ | |
 | Bailundo | -12.4500 | 15.8000 | Estimativa | ❌ | |
 | Bom Pastor | -12.7800 | 15.7350 | Estimativa | ❌ | |
 | Académica | -12.7700 | 15.7450 | Estimativa | ❌ | |
 
 ---
 
 ## Lubango, Angola
 
 | Bairro | Latitude | Longitude | Fonte | Verificado | Notas |
 |--------|----------|-----------|-------|------------|-------|
 | Centro | -14.9167 | 13.5000 | Estimativa | ❌ | |
 | Huíla | -14.9200 | 13.5100 | Estimativa | ❌ | |
 | Mapunda | -14.9100 | 13.4950 | Estimativa | ❌ | |
 | Lucrécia | -14.9250 | 13.5050 | Estimativa | ❌ | |
 
 ---
 
 ## Como Verificar Coordenadas
 
 1. Abrir [Google Maps](https://maps.google.com)
 2. Pesquisar pelo nome do bairro (ex: "Talatona, Luanda, Angola")
 3. Clicar com o botão direito no centro aproximado do bairro
 4. Copiar as coordenadas (formato: -8.917, 13.183)
 5. Atualizar este ficheiro e `src/lib/neighborhood-coordinates.ts`
 
 ## Legenda
 
 - ✅ **Verificado:** Coordenadas confirmadas via fonte oficial
 - ❌ **Não verificado:** Estimativa, precisa de confirmação
 - **Fonte:** Wikipedia, Google Maps, OpenStreetMap, Yandex, etc.