import React from 'react';
import { motion } from 'framer-motion';
import { DumbbellIcon, HomeIcon, ArrowLeftIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
interface NotFoundPageProps {
  onGoHome: () => void;
  onGoBack?: () => void;
}
export function NotFoundPage({ onGoHome, onGoBack }: NotFoundPageProps) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        backgroundColor: '#0f1623'
      }}>

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-32 -left-32 w-80 h-80 rounded-full"
          style={{
            background:
            'radial-gradient(circle, rgba(13,148,136,0.15) 0%, transparent 70%)'
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
          className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full"
          style={{
            background:
            'radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)'
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

      </div>

      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* Brand */}
        <motion.div
          className="flex items-center justify-center gap-2.5 mb-10"
          initial={{
            opacity: 0,
            y: -20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.5
          }}>

          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #14b8a6, #0d9488)'
            }}>

            <DumbbellIcon className="w-4.5 h-4.5 text-white w-5 h-5" />
          </div>
          <span className="text-white font-semibold text-lg tracking-wide">
            FitClub
          </span>
        </motion.div>

        {/* 404 number */}
        <motion.div
          className="relative mb-6"
          initial={{
            opacity: 0,
            scale: 0.6
          }}
          animate={{
            opacity: 1,
            scale: 1
          }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 18,
            delay: 0.1
          }}>

          <div
            className="text-[9rem] sm:text-[12rem] font-black leading-none select-none"
            style={{
              background:
              'linear-gradient(135deg, #14b8a6 0%, #0d9488 40%, rgba(13,148,136,0.3) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>

            404
          </div>
          {/* Floating ring decoration */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-teal-500/10"
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear'
            }} />

          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 sm:w-48 sm:h-48 rounded-full border border-teal-500/10"
            animate={{
              rotate: -360
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'linear'
            }} />

        </motion.div>

        {/* Text */}
        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.5,
            delay: 0.25
          }}>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Page not found
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8 max-w-sm mx-auto">
            The page you're looking for doesn't exist or you don't have
            permission to access it.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.5,
            delay: 0.4
          }}>

          <Button
            variant="primary"
            size="lg"
            onClick={onGoHome}
            className="w-full sm:w-auto">

            <HomeIcon className="w-4 h-4" />
            Go to Dashboard
          </Button>
          {onGoBack &&
          <Button
            variant="outline"
            size="lg"
            onClick={onGoBack}
            className="w-full sm:w-auto border-white/20 text-slate-300 hover:bg-white/10 hover:text-white">

              <ArrowLeftIcon className="w-4 h-4" />
              Go Back
            </Button>
          }
        </motion.div>

        {/* Divider */}
        <motion.div
          className="mt-12 pt-8 border-t border-white/10"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            duration: 0.5,
            delay: 0.6
          }}>

          <p className="text-xs text-slate-600">
            FitClub Management System · 2026
          </p>
        </motion.div>
      </div>
    </div>);

}