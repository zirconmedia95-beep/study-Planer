import { COLORS } from '../lib/constants.js';

export default function Footer() {
  return (
    <footer className="py-4 px-5 md:px-10 text-center text-xs border-t" style={{ borderColor: COLORS.line, color: COLORS.inkSoft, background: COLORS.paper }}>
      Developed by D_Navodye | © 2026. All rights reserved.
    </footer>
  );
}
