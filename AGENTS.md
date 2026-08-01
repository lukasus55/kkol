# Karwińska Olimpiada - Wytyczne dla Agentów AI

## 1. Wyciąganie Common Components
Podczas każdego refactoru oraz budowania nowych widoków (np. Dashboard, Polls), aktywnie poszukuj okazji na wydzielenie uniwersalnych komponentów UI, m.in.:
- **Buttony** (Primary, Secondary, Tertiary, Danger)
- **Modale / Popup'y** (Uniwersalne okienka z propsami na tytuł, treść, akcje)
- **Inputy** (Pola tekstowe, hasła z okiem (toggle visibility), walidatory)
- **Karty** (Uniwersalny layout karty kontenerowej z określonym tłem i obramowaniem)

Uniwersalne komponenty powinny trafiać do folderu `components/ui/` i korzystać z Tailwind CSS. Celem jest osiągnięcie pełnej spójności wizualnej i DRY (Don't Repeat Yourself) we wszystkich nowych częściach aplikacji.
