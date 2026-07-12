export function Footer() {
  return (
    <footer className="mt-auto py-2 md:py-4 border-t border-border">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground px-4">
        <div>
          Created with love in <span className="text-primary">Hong Kong</span>
        </div>
        <div className="flex items-center gap-4">
          {/*<a
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
            href="https://buymeacoffee.com/desktopofsamuel"
          >
            Buy me a coffee
          </a>
          */}
 {/*} <a href="/changelog" className="text-brand hover:underline">Changelog</a>*/}
          <span>© 2025 All Rights Reserved</span>
        </div>
      </div>
    </footer>
  );
}

