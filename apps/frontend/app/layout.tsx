import { Header } from "@/components/Header";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; 

export const metadata = {
  title: "YouTube Growth",
  description: "YouTube channel growth tool",
};


export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session =  await getServerSession(authOptions)
  return (
    <html lang="en">
      <body>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
          <Header session={session} />
          {children}
        </div>
      </body>
    </html>
  );
}