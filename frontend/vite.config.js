import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],

  // server: {
  //   allowedHosts: [
  //     'undemonstrational-viki-reminiscently.ngrok-free.dev',
  //   ],
  // },
  server: {
    // port: 8081, // Set your desired port here
  },
})
