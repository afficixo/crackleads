import nextConfig from 'eslint-config-next'
import tseslintPlugin from '@typescript-eslint/eslint-plugin'

const config = [...nextConfig]

config.push({
  plugins: {
    '@typescript-eslint': tseslintPlugin,
  },
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    'react/no-unescaped-entities': 'off',
    'react-hooks/set-state-in-effect': 'off',
  },
})

export default config
