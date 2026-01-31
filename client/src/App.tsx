import { SignedIn, SignedOut, SignIn, UserButton } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { RoomProvider, useRoom } from './context/RoomContext';
import { RoomControls } from './components/RoomControls';
import { VideoPlayer } from './components/VideoPlayer';

function AppContent() {
  const { isConnected, videoId } = useRoom();

  if (!isConnected || !videoId) {
    return <RoomControls />;
  }

  return <VideoPlayer />;
}

function AuthenticatedApp() {
  return (
    <>
      {/* User button en la esquina superior derecha */}
      <div className="fixed top-4 right-4 z-50">
        <UserButton
          appearance={{
            baseTheme: dark,
            elements: {
              avatarBox: "w-10 h-10"
            }
          }}
        />
      </div>
      <RoomProvider>
        <AppContent />
      </RoomProvider>
    </>
  );
}

function LoginScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
          WatchWithMe
        </h1>
        <p className="text-muted-foreground">
          Inicia sesion para ver directos sincronizados con tus amigos
        </p>
      </div>
      <SignIn
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: '#22d3ee',
            colorBackground: '#0a0f14',
            colorInputBackground: '#0f1419',
            colorInputText: '#ffffff',
          },
          elements: {
            rootBox: "mx-auto",
            card: "bg-[#0a0f14] border border-cyan-500/20 shadow-2xl shadow-cyan-500/10",
            headerTitle: "text-white",
            headerSubtitle: "text-gray-400",
            formFieldLabel: "text-gray-300",
            formFieldInput: "bg-[#0f1419] border-cyan-500/30 text-white",
            formButtonPrimary: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700",
            footerActionLink: "text-cyan-400 hover:text-cyan-300",
            identityPreviewEditButton: "text-cyan-400",
          }
        }}
      />
    </div>
  );
}

function App() {
  return (
    <>
      <SignedOut>
        <LoginScreen />
      </SignedOut>
      <SignedIn>
        <AuthenticatedApp />
      </SignedIn>
    </>
  );
}

export default App;
