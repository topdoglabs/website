import { Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/scroll-to-top.jsx";
import { AppDetailPage } from "./pages/app-detail.jsx";
import { AppsPage } from "./pages/apps.jsx";
import { HomePage } from "./pages/home.jsx";
import { PrivacyPage } from "./pages/privacy.jsx";
import { StaticPage } from "./pages/static-page.jsx";
import { SupportPage } from "./pages/support.jsx";

export const App = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/apps" element={<AppsPage />} />
        <Route path="/apps/:slug" element={<AppDetailPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/support-form" element={<SupportPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/about" element={<StaticPage slug="about" />} />
        <Route path="/faq" element={<StaticPage slug="faq" />} />
        <Route path="/terms" element={<StaticPage slug="terms" />} />
        <Route path="/cookies" element={<StaticPage slug="cookies" />} />
        <Route path="/connect" element={<StaticPage slug="connect" />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </>
  );
};
