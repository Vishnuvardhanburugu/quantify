import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4">
              <div className="h-16 w-36 flex items-center justify-center -ml-2">
                <video
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                  muted
                  playsInline
                >
                  <source src="/Logo_Redesign_for_Trading_Platform.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              AI-powered quantitative trading platform for smarter decisions.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Company</h4>
            <div className="flex flex-col gap-2">
              <Link to="/about" className="text-sm text-muted-foreground hover:text-primary">About</Link>
              <Link to="/support" className="text-sm text-muted-foreground hover:text-primary">Support</Link>
              <Link to="/logo" className="text-sm text-muted-foreground hover:text-primary">Logo</Link>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Products</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Dashboard</span>
              <span className="text-sm text-muted-foreground">Portfolio Tracker</span>
              <span className="text-sm text-muted-foreground">Trade Journal</span>
              <span className="text-sm text-muted-foreground">AI Assistant</span>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Legal</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Privacy Policy</span>
              <span className="text-sm text-muted-foreground">Terms of Service</span>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Quantify. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
