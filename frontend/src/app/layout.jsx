import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LisaAI from '../components/LisaAI';

export const metadata = {
  title: 'Organic Arusuvai - A Venture of Vani Enterprises',
  description: 'Shop 100% organic spices, farm products, millets, ready mixes & cold pressed oils. Fresh from farm to your doorstep. Free delivery above ₹499.',
  keywords: 'organic products, organic spices, cold pressed oils, millets, farm products, chennai, organic food online',
  icons: {
     icon: '/logos/SpecialLogo.png',
     apple: '/logos/SpecialLogo.png',
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
        <script src="https://sdk.canva.com/designbutton/v2/api.js" async></script>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <LisaAI />
        <Footer />
      </body>
    </html>
  );
}
