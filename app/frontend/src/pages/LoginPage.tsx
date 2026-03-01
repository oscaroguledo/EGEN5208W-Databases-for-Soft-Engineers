import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DumbbellIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User } from '../data/types';
import { toast } from 'sonner';
interface LoginPageProps {
  users: User[];
  onLogin: (user: User) => void;
  onGoRegister: () => void;
}
const DEMO_ACCOUNTS = [
{
  email: 'alice@gym.com',
  role: 'Member'
},
{
  email: 'mike@gym.com',
  role: 'Trainer'
},
{
  email: 'admin@fitclub.com',
  role: 'Admin'
}];

export function LoginPage({ users, onLogin, onGoRegister }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const user = users.find(
        (x) =>
        x.username.toLowerCase() === email.toLowerCase().trim() &&
        x.password === password
      );
      setLoading(false);
      if (user) {
        toast.success(`Welcome back!`);
        onLogin(user);
      } else {
        toast.error('Invalid email or password. Please try again.');
      }
    }, 400);
  };
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundColor: '#0f1623'
      }}>

      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, #0d9488 0%, transparent 70%)'
          }}
          animate={{
            scale: [1, 1.12, 1],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }} />

        <motion.div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, #0d9488 0%, transparent 70%)'
          }}
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.12, 0.2, 0.12]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2
          }} />

        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{
            background: 'radial-gradient(circle, #14b8a6 0%, transparent 70%)'
          }} />

      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand - slides down */}
        <motion.div
          className="text-center mb-8"
          initial={{
            opacity: 0,
            y: -24
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.5,
            ease: 'easeOut'
          }}>

          <motion.div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #14b8a6, #0d9488)'
            }}
            initial={{
              scale: 0.6,
              rotate: -15
            }}
            animate={{
              scale: 1,
              rotate: 0
            }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 18,
              delay: 0.1
            }}>

            <DumbbellIcon className="w-7 h-7 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            FitClub
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Management System</p>
        </motion.div>

        {/* Card - slides up */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/10 dark:border-slate-700"
          initial={{
            opacity: 0,
            y: 32
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.45,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.15
          }}>

          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            Welcome back
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Sign in with your email to access your portal
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email" />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              showPasswordToggle={true}
              autoComplete="current-password" />

            <motion.div
              whileTap={{
                scale: 0.98
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 17
              }}>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2">

                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </motion.div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              New member?{' '}
              <button
                onClick={onGoRegister}
                className="text-teal-600 dark:text-teal-400 font-semibold hover:text-teal-700 dark:hover:text-teal-300 transition-colors">

                Register here
              </button>
            </p>
          </div>
        </motion.div>

        {/* Demo hint - fades in last */}
        <motion.div
          className="mt-4 text-center space-y-1"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            duration: 0.4,
            delay: 0.5
          }}>

          <p className="text-xs text-slate-500 font-medium">
            Demo accounts{' '}
            <span className="text-slate-600">
              (password: <span className="text-slate-400">password</span>)
            </span>
          </p>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
            {DEMO_ACCOUNTS.map(({ email: e, role }) =>
            <motion.button
              key={e}
              type="button"
              onClick={() => setEmail(e)}
              className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
              title={`Fill in ${role} email`}
              whileHover={{
                scale: 1.05
              }}
              whileTap={{
                scale: 0.95
              }}>

                {e}
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>);

}