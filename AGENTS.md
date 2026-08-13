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

## 3. Komenda "refactor stronaxyz"
Jeśli użytkownik użyje sformułowania w stylu "refactor stronaxyz" lub "przepisz stronę", oznacza to następujący zestaw działań do wykonania przez agenta:
1. Odtworzenie **layoutu i układu** na podstawie dostarczonego zrzutu ekranu (oraz starych plików HTML/JS, jeśli istnieją).
2. Wykorzystanie nowoczesnego stosu technologicznego: **React (Next.js App Router) + Tailwind CSS**.
3. Rezygnacja ze starych, sztywnych kolorów/klas z poprzednich plików (np. `login.css`) i zastosowanie **naszego domyślnego motywu, kolorów oraz komponentów** (np. `components/ui/`).
4. Utrzymanie pełnej spójności wizualnej (nasze przyciski, kolory tła, akcenty z `globals.css`).

## 4. Płaski Design (Flat Design)
Aplikacja KKOL bazuje na **płaskim designie**. Unikaj używania głębokich cieni (`shadow-md`, `shadow-lg`, `shadow-xl` itp.). Zamiast cieni, do oddzielania elementów i kontenerów od tła używaj:
- Wyraźnych obramowań (`border border-bg-400` lub inne kolory borderów).
- Subtelnych różnic w odcieniach tła (`bg-bg-100` vs `bg-bg-200`).
Kieruj się minimalizmem wizualnym bez efektów przestrzennych.

## 5. Maksymalne zaokrąglenie (Border Radius)
Zgodnie z przyjętą estetyką, unikaj używania dużych zaokrągleń (takich jak `rounded-lg`, `rounded-xl`, `rounded-2xl` czy `rounded-3xl`) w przypadku ogólnych kontenerów, kart, popupów czy przycisków.
Maksymalna wartość, jakiej powinieneś używać w takich elementach, to **`rounded-md`**.
Okrągłe elementy (np. `rounded-full` dla zdjęć profilowych) są nadal dozwolone tam, gdzie jest to logicznie uzasadnione, ale nie stosuj ich dla bloków interfejsu (np. przyciski powinny pozostać maksymalnie na poziomie `rounded-md`).
