# Karwińska Olimpiada - Wytyczne dla Agentów AI

## 1. Wyciąganie Common Components
Podczas każdego refactoru oraz budowania nowych widoków (np. Dashboard, Polls), aktywnie poszukuj okazji na wydzielenie uniwersalnych komponentów UI, m.in.:
- **Buttony** (Primary, Secondary, Tertiary, Danger)
- **Modale / Popup'y** (Uniwersalne okienka z propsami na tytuł, treść, akcje)
- **Inputy** (Pola tekstowe, hasła z okiem (toggle visibility), walidatory)
- **Karty** (Uniwersalny layout karty kontenerowej z określonym tłem i obramowaniem)

Uniwersalne komponenty powinny trafiać do folderu `components/ui/` i korzystać z Tailwind CSS. Celem jest osiągnięcie pełnej spójności wizualnej i DRY (Don't Repeat Yourself) we wszystkich nowych częściach aplikacji.

## 2. Zasady Zamykania Popupów / Modali
Każdy nowo tworzony lub refaktorowany popup/modal musi przestrzegać następujących 3 zasad zamykania:
1. Zamykanie za pomocą widocznego przycisku (np. krzyżyk w rogu lub przycisk "Zamknij").
2. Zamykanie za pomocą naciśnięcia poza oknem popupa (kliknięcie w zaciemnione tło/backdrop).
3. Zamykanie za pomocą klawisza "ESC" na klawiaturze.
