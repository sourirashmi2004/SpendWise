# Personal Expense Tracker (SpendWise) — Minimal Java Full Stack MVP

A clean, beginner-friendly **Personal Expense Tracker** built with **Spring Boot**, **Spring Security (BCrypt)**, **Spring Data JPA**, **H2 / MySQL**, **Bootstrap 5**, and **Chart.js**.

## How to Run

### Option 1: Zero-Setup Local Run (H2 Database)

```powershell
.\mvnw.cmd spring-boot:run
```

Then open **http://localhost:8080** in your browser and click **Try Demo Account** (`demo@expensetracker.com` / `demo1234`), or register a new user.

### Option 2: Run with MySQL

1. Update username/password in `src/main/resources/application-mysql.properties`.
2. Start the app with the `mysql` profile:

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=mysql"
```

## Run Tests

```powershell
.\mvnw.cmd test
```
