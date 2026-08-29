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

## 3. Testowanie Backendu (Vitest)
Kiedy edytujesz, modyfikujesz, lub tworzysz jakikolwiek plik backendowy (np. endpointy API w `pages/api/`), **zawsze** musisz zaktualizować lub napisać dla nich rygorystyczne testy jednostkowe. 
- Testy znajdują się w folderze `__tests__/api/`.
- Wykorzystuj środowisko `vitest` oraz `node-mocks-http` do symulowania żądań.
- Pamiętaj o mockowaniu zapytań bazodanowych (`vi.hoisted` + `vi.mock('../../db.js')`).
- Dokładnie sprawdzaj *edge case'y* (nieprawidłowe dane, brak uprawnień, walidacje).
- **Po każdych większych modyfikacjach backendu masz obowiązek uruchomić komendę `npx vitest run` w terminalu**, aby zweryfikować czy wszystko działa poprawnie.

## 4. Struktura Bazy Danych
Plik `types/db.ts` może służyć jako podgląd na strukturę bazy danych. Traktuj go jako użyteczny drogowskaz, ale pamiętaj, że nie jest on perfekcyjnym odzwierciedleniem bazy (np. nie zawiera dokładnych informacji o kluczach obcych czy constraintach). Zawsze możesz na niego spojrzeć, aby zrozumieć ogólny zarys modeli danych.

## 5. Płaski Design (Flat Design)
Aplikacja KKOL bazuje na **płaskim designie**. Unikaj używania głębokich cieni (`shadow-md`, `shadow-lg`, `shadow-xl` itp.). Zamiast cieni, do oddzielania elementów i kontenerów od tła używaj subtelnych różnic w odcieniach tła (`bg-bg-100` vs `bg-bg-200`).
Kieruj się minimalizmem wizualnym bez efektów przestrzennych.

## 5. Maksymalne zaokrąglenie (Border Radius)
Zgodnie z przyjętą estetyką, unikaj używania dużych zaokrągleń (takich jak `rounded-lg`, `rounded-xl`, `rounded-2xl` czy `rounded-3xl`) w przypadku ogólnych kontenerów, kart, popupów czy przycisków.
Maksymalna wartość, jakiej powinieneś używać w takich elementach, to **`rounded-md`**.
Okrągłe elementy (np. `rounded-full` dla zdjęć profilowych) są nadal dozwolone tam, gdzie jest to logicznie uzasadnione, ale nie stosuj ich dla bloków interfejsu (np. przyciski powinny pozostać maksymalnie na poziomie `rounded-md`).
