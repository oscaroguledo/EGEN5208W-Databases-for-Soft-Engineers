import React from 'react';
import { motion } from 'framer-motion';
import { DumbbellIcon, WrenchIcon, ClockIcon, MailIcon } from 'lucide-react';
interface MaintenancePageProps {
  estimatedTime?: string;
  message?: string;
}
export function MaintenancePage({
  estimatedTime = 'a few hours',
  message = "We're performing scheduled maintenance to improve your experience."
}: MaintenancePageProps) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        backgroundColor: '#0f1623'
      }}>

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full"
          style={{
            background:
            'radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)'
          }}
          animate={{
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: 'easeInOut'
          }} />

        <motion.div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full"
          style={{
            background:
            'radial-gradient(circle, rgba(13,148,136,0.08) 0%, transparent 70%)'
          }}
          animate={{
            scale: [1, 1.08, 1]
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 3
          }} />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
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

            <DumbbellIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-semibold text-lg tracking-wide">
            FitClub
          </span>
        </motion.div>

        {/* Animated gear icon */}
        <motion.div
          className="flex items-center justify-center mb-8"
          initial={{
            opacity: 0,
            scale: 0.5
          }}
          animate={{
            opacity: 1,
            scale: 1
          }}
          transition={{
            type: 'spring',
            stiffness: 180,
            damping: 16,
            delay: 0.1
          }}>

          <div className="relative">
            {/* Outer ring */}
            <motion.div
              className="w-32 h-32 rounded-full border-2 border-teal-500/20 flex items-center justify-center"
              animate={{
                rotate: 360
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear'
              }}>

              {/* Dots on ring */}
              {[0, 60, 120, 180, 240, 300].map((deg) =>
              <div
                key={deg}
                className="absolute w-2 h-2 rounded-full bg-teal-500/40"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${deg}deg) translateY(-60px) translate(-50%, -50%)`
                }} />

              )}
            </motion.div>

            {/* Inner circle */}
            <div
              className="absolute inset-4 rounded-full flex items-center justify-center"
              style={{
                background:
                'linear-gradient(135deg, rgba(20,184,166,0.15), rgba(13,148,136,0.1))'
              }}>

              <motion.div
                animate={{
                  rotate: [0, 15, -15, 0]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}>

                <WrenchIcon className="w-10 h-10 text-teal-400" />
              </motion.div>
            </div>
          </div>
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
            delay: 0.3
          }}>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Under Maintenance
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8 max-w-sm mx-auto">
            {message}
          </p>
        </motion.div>

        {/* Info cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8"
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
            delay: 0.45
          }}>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <ClockIcon className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                Estimated Time
              </span>
            </div>
            <p className="text-white text-sm font-medium">{estimatedTime}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <MailIcon className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                Support
              </span>
            </div>
            <p className="text-white text-sm font-medium">
              support@fitclub.com
            </p>
          </div>
        </motion.div>

        {/* Progress bar animation */}
        <motion.div
          className="mb-8"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            delay: 0.6
          }}>

          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #14b8a6, #0d9488)'
              }}
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }} />

          </div>
          <p className="text-xs text-slate-600 mt-2">Working on it…</p>
        </motion.div>

        <motion.div
          className="pt-8 border-t border-white/10"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            duration: 0.5,
            delay: 0.7
          }}>

          <p className="text-xs text-slate-600">
            FitClub Management System · 2026
          </p>
        </motion.div>
      </div>
    </div>);

}