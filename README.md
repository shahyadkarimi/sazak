This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [https://sazak-academy.liara.run](https://sazak-academy.liara.run) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy on cPanel

### Important Notes for cPanel Deployment:

1. **Static Files**: Make sure the `public/uploads` folder exists and has proper permissions (chmod 755)
2. **File Uploads**: User uploaded files are stored in `public/uploads/profiles/`
3. **Server Configuration**: Ensure your server is configured to serve files from the `public` directory

### Common Issues:

- **Uploaded images not displaying**: Check that the `public/uploads` folder exists and has proper read permissions
- **404 errors for uploads**: Verify that your web server (Apache/Nginx) is configured to serve static files from the public directory
- **Permission denied**: Run `chmod -R 755 public/uploads` to fix permissions