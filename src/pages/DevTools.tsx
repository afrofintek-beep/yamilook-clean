import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Database, Settings, Play, Trash2, CheckCircle, Phone } from 'lucide-react';
import { TEST_USERS, MOCK_POSTS, BAIRROS, loginAsTestUser, cleanTestData } from '@/lib/test-data';
import { supabase } from '@/integrations/supabase/client';
import env from '@/lib/env';
import { toast } from 'sonner';
import { CallDiagnosticsPanel } from '@/components/calls/CallDiagnosticsPanel';

const DevTools = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<string[]>([]);

  const handleLoginAs = async (userKey: keyof typeof TEST_USERS) => {
    setIsLoading(userKey);
    try {
      const result = await loginAsTestUser(userKey);
      if (result) {
        toast.success(`Logged in as ${TEST_USERS[userKey].displayName}`);
        setCompletedActions([...completedActions, `login-${userKey}`]);
        navigate('/feed');
      } else {
        toast.error('User not found. Create test users first.');
      }
    } catch (error) {
      toast.error('Login failed');
    }
    setIsLoading(null);
  };

  const handleSeedData = async () => {
    setIsLoading('seed');
    try {
      // Get the current user's session for proper authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('You must be logged in to seed test data');
        setIsLoading(null);
        return;
      }

      // Call edge function with user's JWT token for proper authentication
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seed-test-users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );
      const data = await response.json();
      
      if (data.success) {
        const usersCreated = data.results?.users?.filter((r: { status: string }) => r.status === 'created').length || 0;
        const postsCreated = data.results?.posts || 0;
        toast.success(`Created ${usersCreated} test users and ${postsCreated} sample posts!`);
        setCompletedActions([...completedActions, 'seed']);
      } else {
        toast.error(data.error || 'Failed to seed data');
      }
    } catch (error) {
      toast.error('Failed to seed data');
    }
    setIsLoading(null);
  };

  const handleCleanData = async () => {
    setIsLoading('clean');
    try {
      await cleanTestData();
      toast.success('Test data cleaned!');
      setCompletedActions([...completedActions, 'clean']);
    } catch (error) {
      toast.error('Failed to clean data');
    }
    setIsLoading(null);
  };

  if (env.isProduction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Dev tools are not available in production.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b p-4 safe-top">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Dev Tools</h1>
            <p className="text-sm text-muted-foreground">Testing & Development</p>
          </div>
          <Badge variant="outline" className="ml-auto">
            {env.current}
          </Badge>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">
              <User className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="data">
              <Database className="h-4 w-4 mr-2" />
              Data
            </TabsTrigger>
            <TabsTrigger value="calls">
              <Phone className="h-4 w-4 mr-2" />
              Calls
            </TabsTrigger>
            <TabsTrigger value="env">
              <Settings className="h-4 w-4 mr-2" />
              Env
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Accounts</CardTitle>
                <CardDescription>Quick login as test users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(TEST_USERS).map(([key, user]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <Badge variant="secondary" className="mt-1">{user.bairro}</Badge>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleLoginAs(key as keyof typeof TEST_USERS)}
                      disabled={isLoading === key}
                    >
                      {isLoading === key ? 'Logging in...' : 'Login'}
                      {completedActions.includes(`login-${key}`) && (
                        <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                      )}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Actions</CardTitle>
                <CardDescription>Seed or clean test data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleSeedData} 
                  className="w-full" 
                  disabled={isLoading === 'seed'}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isLoading === 'seed' ? 'Seeding...' : 'Seed All Test Data'}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleCleanData} 
                  className="w-full"
                  disabled={isLoading === 'clean'}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isLoading === 'clean' ? 'Cleaning...' : 'Clean Test Data'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mock Posts Preview</CardTitle>
                <CardDescription>{MOCK_POSTS.length} posts available</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {MOCK_POSTS.slice(0, 3).map((post, i) => (
                  <div key={i} className="p-2 rounded border text-sm">
                    <p className="text-muted-foreground">{post.content}</p>
                    <Badge variant="outline" className="mt-1">{post.location}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bairros</CardTitle>
                <CardDescription>Available locations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {BAIRROS.map((bairro) => (
                    <Badge key={bairro.name} variant="secondary">
                      {bairro.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calls" className="space-y-4 mt-4">
            <CallDiagnosticsPanel />
          </TabsContent>

          <TabsContent value="env" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Environment Config</CardTitle>
                <CardDescription>Current environment settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Environment</p>
                    <p className="font-medium">{env.current}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Debug Tools</p>
                    <p className="font-medium">{env.features.enableDebugTools ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Mock Data</p>
                    <p className="font-medium">{env.features.enableMockData ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Test Accounts</p>
                    <p className="font-medium">{env.features.enableTestAccounts ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-2">API Configuration</p>
                  <code className="text-xs block break-all bg-muted p-2 rounded">
                    URL: {env.api.supabaseUrl}
                  </code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DevTools;
