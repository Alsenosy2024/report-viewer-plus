import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { withPageAccessibility } from "@/lib/withPageAccessibility";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <main className="text-center" role="main">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </main>
    </div>
  );
};

// Wrap the page component with accessibility enhancements
export default withPageAccessibility(NotFound);
