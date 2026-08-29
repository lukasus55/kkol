# Karwińska Olimpiada

<p align="center">
  <a href="https://www.kkol.pl"><img alt="Website" src="https://img.shields.io/badge/Website-red?style=for-the-badge"></a>
  <a href="#features"><img alt="Features" src="https://img.shields.io/badge/Features-yellow?style=for-the-badge"></a>
  <a href="#technologies--architecture"><img alt="Technologies & Architecture" src="https://img.shields.io/badge/Technologies-purple?style=for-the-badge"></a>
  <a href="#documentation"><img alt="Documentation" src="https://img.shields.io/badge/Documentation-blue?style=for-the-badge"></a>
  <a href="#repository-status"><img alt="Repository Status" src="https://img.shields.io/badge/Contributing-green?style=for-the-badge"></a>
</p>

Welcome to the official tournament tracking and management platform for the **Karwińska Olimpiada** - an annual series of competitive tournaments among friends. 

This custom-built web application serves as the central hub for planning events, tracking scores, managing player profiles, and maintaining the historical rankings of the entire series.

---

## Features

This platform is designed to handle everything from day-to-day calendar tracking to complex tournament scoring.

* **Personalized Profiles & Calendars:** Every player has a dedicated dashboard with a personal calendar to track their upcoming events and matches.
* **Tournament Management:** A robust permissions system allows Tournament Owners and Managers to create events, edit details, and input official match results.
* **Polls:** Built-in system for tournament organizers to create custom polls, manage labels, and gather player votes directly on the platform.
* **Automated Global Rankings:** The global leaderboard updates automatically based on the match results typed into the manager dashboard.
* **Public Player Profiles:** You can view any player's tournament history, stats, and past results.
* **Major Tournament Hubs:** Massive, flagship tournaments get their own fully customized, dedicated pages to handle specific rulesets or unique structures.
* **Tournament-Specific Tools:** Includes custom-built utilities tailored to specific games, such as an integrated Catan map previewer.

---

## Technologies & Architecture

* **Frontend:** Next.js and Tailwind CSS. The application was recently refactored from Vanilla HTML and CSS. *Some pages still use the old Vanilla CSS styling.*
* **Backend API:** Next.js API Routes written in TypeScript.
* **Database:** PostgreSQL.
  * *Note: The complete Entity-Relationship Diagram (ERD) for the database is located in the API Documentation.*
* **Infrastructure:** Docker. The entire environment (including the PostgreSQL database) is containerized for seamless local self-hosting and development.

---

## Documentation

Detailed documentation for the backend infrastructure, including security layers, required payloads, and database structure, is maintained directly in the repository.

**[View the full API Documentation here](http://kkol.pl/docs)**

---

## Repository Status

**This is a personal project.** The source code is hosted publicly on GitHub for portfolio and reference purposes. 

* **Issues:** Feedback and bug reports are welcome! If you spot a bug or have a suggestion, feel free to open an issue. Please make sure your tickets are as detailed as possible (include steps to reproduce, expected behavior, and any relevant errors).
* **Pull Requests:** At this time, **pull requests are not accepted.** This is a closed environment customized for a specific group of friends.