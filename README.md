# 🌟 GitHub Profile Visualizer

<div align="center">
  <h3>Transform standard GitHub profiles into stunning, interactive visual experiences.</h3>
</div>

<br />

> A premium React application that generates a beautiful, animated dashboard of your GitHub statistics, complete with contribution heatmaps, dynamic developer badges, and a downloadable profile card.

## ✨ Key Features

- **📊 Comprehensive Profile Metrics**: View followers, following, public repos, and detailed bio in a sleek glassmorphic UI.
- **🏆 Dynamic Developer Badges**: Automatically awards custom badges (e.g., *Star Magnet, Polyglot, Fork Master*) based on analyzing your repository data.
- **🔥 Streak Analytics**: Calculates and visually displays your Total Contributions, Current Streak, and Best Contribution Streak.
- **📈 Contribution Heatmap**: A stylized, dark-mode customized GitHub contribution graph mirroring your native GitHub activity calendar.
- **🎨 Top Languages Analytics**: Visual progress bar breaking down the top 5 programming languages used across all your public repositories.
- **🔍 Advanced Repo Filtering & Sorting**: Filter your repositories by programming language, or sort them seamlessly by stars, forks, or recent updates.
- **🖼️ Downloadable Profile Card**: Export your visually stunning profile summary as a high-quality PNG image with a single click to share on social media.
- **✨ Premium UI & Animations**: Built with a modern glassmorphic design system and smooth, satisfying micro-animations powered by Framer Motion.

## 🛠️ Technology Stack

- **Core**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Fetching**: [Axios](https://axios-http.com/) (GitHub REST API)
- **Extra Libraries**: `react-github-calendar`, `html-to-image`

## 
🚀 Demo You can try **Demo** live here: [![Deploy with Vercel](https://vercel.com/button)](https://git-hub-visualizer.vercel.app/)

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and npm (or yarn/pnpm) installed on your machine.

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/github-visualizer.git
   cd github-visualizer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **View the app:** Open your browser and navigate to `http://localhost:5173`.

## 💡 How it Works & API Limits
The application primarily uses the official unauthenticated GitHub REST API (`api.github.com`) to fetch user profiles and repository data. 
To calculate streaks and render the heatmap without requiring user authentication tokens, it leverages the `github-contributions-api.deno.dev` service to securely parse public contribution calendar data.

⚠️ *Note: Unauthenticated GitHub API requests are limited to 60 requests per hour per IP address. If you encounter rate limits, try again later.*

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## 📜 License
This project is open-source and available under the MIT License.

---
*Built with ❤️ by a developer, for developers.*
