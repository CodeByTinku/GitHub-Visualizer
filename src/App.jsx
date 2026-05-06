import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Terminal, Activity, Star, GitFork, Users } from 'lucide-react'
import axios from 'axios'

function App() {
  const [username, setUsername] = useState('')
  const [userData, setUserData] = useState(null)
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchGithubData = async (e) => {
    e.preventDefault()
    if (!username.trim()) return

    setLoading(true)
    setError('')
    setUserData(null)
    setRepos([])

    try {
      // Free REST API limit: 60 requests/hr (unauthenticated)
      const userRes = await axios.get(`https://api.github.com/users/${username}`)
      setUserData(userRes.data)

      const repoRes = await axios.get(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=6`
      )
      setRepos(repoRes.data)
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('User not found.')
      } else if (err.response && err.response.status === 403) {
        setError('API rate limit exceeded. Please try again later or add a token.')
      } else {
        setError('Failed to fetch data.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-12 flex flex-col items-center">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-3xl flex flex-col items-center gap-8"
      >
        <div className="flex items-center gap-3 text-primary mb-2">
          <Terminal size={40} />
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">GitHub Visualizer</h1>
        </div>
        
        <p className="text-text-muted text-center text-lg max-w-lg">
          Visualize your GitHub profile with interactive data, repos, and activity.
        </p>

        {/* Search Bar */}
        <form 
          onSubmit={fetchGithubData}
          className="w-full flex items-center glass-panel p-2 pl-6 focus-within:border-primary/50 transition-colors duration-300"
        >
          <Search className="text-text-muted" size={20} />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter GitHub Username..."
            className="w-full bg-transparent border-none outline-none text-text px-4 py-3 placeholder:text-text-muted/60"
          />
          <button 
            type="submit"
            disabled={loading || !username.trim()}
            className="bg-primary text-background px-6 py-3 rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? 'Searching...' : 'Visualize'}
          </button>
        </form>

        {error && (
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-red-400 bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20"
          >
            {error}
          </motion.p>
        )}

        {/* Results Area */}
        {userData && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full space-y-8"
          >
            {/* Profile Card */}
            <div className="glass-panel p-8 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500" />
              
              <img 
                src={userData.avatar_url} 
                alt={userData.name || userData.login} 
                className="w-32 h-32 rounded-full border-4 border-surface shadow-lg z-10"
              />
              
              <div className="flex-1 text-center md:text-left z-10">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {userData.name || userData.login}
                </h2>
                <a 
                  href={userData.html_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-primary hover:underline mb-4 inline-block"
                >
                  @{userData.login}
                </a>
                <p className="text-text-muted max-w-md">
                  {userData.bio || 'No bio provided.'}
                </p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                  <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-lg border border-border/50">
                    <Users size={16} className="text-text-muted" />
                    <span><strong className="text-white">{userData.followers}</strong> followers</span>
                  </div>
                  <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-lg border border-border/50">
                    <Activity size={16} className="text-text-muted" />
                    <span><strong className="text-white">{userData.public_repos}</strong> repos</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Repos Grid */}
            <h3 className="text-2xl font-semibold mt-12 mb-6">Recent Repositories</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {repos.map((repo, i) => (
                <motion.a
                  href={repo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  key={repo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-panel p-6 hover:border-primary/40 transition-colors group cursor-pointer block"
                >
                  <h4 className="text-lg font-semibold text-white group-hover:text-primary transition-colors mb-2 truncate">
                    {repo.name}
                  </h4>
                  <p className="text-text-muted text-sm mb-4 line-clamp-2 min-h-[40px]">
                    {repo.description || 'No description available.'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    {repo.language && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star size={14} /> {repo.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork size={14} /> {repo.forks_count}
                    </span>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default App
