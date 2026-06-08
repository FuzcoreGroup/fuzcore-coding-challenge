# Coding Challenge

## Instructions

- We have given you a simple full stack app with React, TS, Express, PGSQL running in docker
- We ask you to fork this repo, use an AI coding agent throughout the task, and build the app according to the spec below
- You must record both your screen and your voice during this task (if your submission does not include CLEAR voice audio it will be disqualified, so please check this)
- You will have up to 2 hours to complete the task, though you can take less time if you wish
- If you prefer, you can complete the work before recording, so long as you can clearly walk us through the code, the decisions you made, and the AI prompts you used
- You must talk us through your thinking and problem solving during the task, why you are making decisions and how you are guiding the AI
- Submit the 2 hour video to us in an email or through LinkedIn

>[!IMPORTANT]
>To succeed, you MUST clearly demonstrate the following:
>
>- Don't just READ the code, explain WHY we need the code; why do we need to hash passwords, for example?
>- Speak CLEARLY and SLOWLY, use a dedicated MICROPHONE and remove BACKGROUND NOISE.
>- Show us your IDE and that you can use an AI coding agent; don't just use a browser chat bot.
>- Make your app UI look BEAUTIFUL and PROFESSIONAL! An unstyled/bare app will be DISQUALIFIED. Use Google Stitch if required; it's FREE!

>[!WARNING]
>Avoid the following:
>
>- Don't focus on unit testing - manual checks are fine.
>- Don't change the tech stack as it will waste time, though you can use different providers other than Stripe or Gemini SDK if they are not available to you.

---

## The Product

A small-business accounting app that lets owners manage customers, record transactions, and issue invoices — all in one place.

## Core Features

Work through these features; You MUST complete all of them.

### 1. Auth
Users can sign up for an account, log in, and log out. All other features require authentication.

### 2. Customers
Users can view a list of their customers, add new ones, edit existing ones, and delete them.

### 3. Transactions
Users can view a list of transactions, each showing its amount, type (income or expense), and category. Users can add new transactions and filter the list by type or category.

### 4. Invoices
Users can create an invoice for a customer with one or more line items. Invoices can be viewed and their status updated through the lifecycle: **draft → sent → paid**.

## Stretch Goals

If you have time left, build any of the features below:

- **Dashboard** — a summary view showing total revenue, total expenses, and the value of outstanding invoices.
- **Categories** — a management screen for income and expense categories.
- **PDF export** — generate a downloadable PDF for an invoice.
- **CSV import** — bulk-import transactions from a CSV file.
- **AI categorisation** — automatically suggest a category for a transaction based on its description (Gemini SDK suggested, but any equivalent is fine).
- **Payment links** — add a payment link to an invoice (Stripe suggested, but any equivalent is fine).
