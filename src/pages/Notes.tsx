import { useState } from 'react';

interface Section {
  id: string;
  icon: string;
  title: string;
  content: React.ReactNode;
}

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <div className="note-codeblock">
      <div className="note-codeblock-header">
        <span className="note-lang">{lang}</span>
        <button className="note-copy-btn" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
      </div>
      <pre><code>{code.trim()}</code></pre>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="note-step">
      <div className="note-step-num">{n}</div>
      <div className="note-step-body">{children}</div>
    </div>
  );
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return <span className="note-tag" style={{ background: color + '22', color, border: `1px solid ${color}44` }}>{children}</span>;
}

function Alert({ type, children }: { type: 'tip' | 'warn' | 'info'; children: React.ReactNode }) {
  const map = { tip: { icon: '💡', color: '#10b981' }, warn: { icon: '⚠️', color: '#f59e0b' }, info: { icon: 'ℹ️', color: '#6366f1' } };
  const { icon, color } = map[type];
  return (
    <div className="note-alert" style={{ borderLeft: `3px solid ${color}`, background: color + '11' }}>
      <span>{icon}</span>
      <div>{children}</div>
    </div>
  );
}

export default function Notes() {
  const [activeSection, setActiveSection] = useState('google-auth');
  const [copiedAll, setCopiedAll] = useState(false);

  function copyFullChecklist() {
    const markdown = `# 📋 PROJECT AUDIT CHECKLIST FOR AI REVIEW & CODE VALIDATION

Hãy kiểm tra toàn bộ mã nguồn và cấu hình của dự án hiện tại đối chiếu với danh sách các tiêu chuẩn kỹ thuật bắt buộc dưới đây:

## 1. 🔑 Google Login & Supabase Auth Integration
- [ ] Bật Google OAuth Provider trong Supabase Dashboard với Authorized Redirect URI \`https://<project-ref>.supabase.co/auth/v1/callback\`
- [ ] Frontend dùng \`@supabase/supabase-js\` để tạo \`supabaseClient\` từ \`VITE_SUPABASE_URL\` & \`VITE_SUPABASE_ANON_KEY\`
- [ ] Nút login gọi \`signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })\`
- [ ] Lắng nghe session thay đổi tự động qua \`supabase.auth.onAuthStateChange\`
- [ ] Kiểm tra session trên mọi Protected Route trước khi render UI
- [ ] Khai báo Row Level Security (RLS) cho tất cả bảng DB liên quan đến User (\`auth.uid() = user_id\`)

## 2. 🚀 Monorepo & Vercel Deployment
- [ ] Cấu trúc folder chuẩn Monorepo (\`apps/web\`, \`apps/api\`, \`packages/shared\`)
- [ ] Root Directory trong Vercel Project trỏ chính xác tới thư mục app (\`apps/web\` hoặc \`apps/api\`)
- [ ] Cấu hình biến môi trường Frontend có tiền tố \`VITE_\` (hoặc \`NEXT_PUBLIC_\`) trong Vercel Settings
- [ ] Cấu hình \`vercel.json\` cho Backend Serverless (Express/NestJS)
- [ ] Cấu hình Custom Domain CNAME \`cname.vercel-dns.com\` và SSL Certificate

## 3. 🔌 Quy Hoạch Port Cố Định Cho Local Dev (Non-Docker)
- [ ] Khai báo \`port\` cố định cho Frontend trong \`vite.config.ts\` (hoặc \`package.json\` \`next dev -p <port>\`)
- [ ] Bật \`strictPort: true\` trong \`vite.config.ts\` để ép không tự đổi port khi port bận
- [ ] Cấu hình \`PORT\` môi trường riêng cho Backend API Express / NestJS (e.g. 5001, 5002...)
- [ ] Thêm dải port local \`http://localhost:<port>/**\` vào Supabase Auth Additional Redirect URLs Whitelist

## 4. 🔄 Shared Auth & Chống Redirect Sai Sub-App
- [ ] Khai báo chính xác domain Production và Localhost của từng sub-app vào Supabase Auth Redirect URLs Whitelist
- [ ] Luôn truyền \`redirectTo: window.location.origin\` (hoặc exact callback path) khi gọi \`signInWithOAuth\`
- [ ] Áp dụng RLS / App Scope Isolation (e.g., bảng \`user_app_access\`) nếu cần kiểm soát quyền mở từng app

## 5. 💻 Local Dev với Remote Supabase DB
- [ ] File \`.env.local\` ở máy cá nhân trỏ tới Remote Supabase Project (\`*.supabase.co\`)
- [ ] Cấu hình CORS cho Backend API Express/NestJS cho phép origin \`http://localhost:<port>\` gọi API
- [ ] Test quy trình Google Login tại Localhost quay về đúng domain local \`http://localhost:<port>\`

## 6. 🗄️ Supabase Schema & Realtime Best Practices
- [ ] Mọi bảng Database tạo mới BẮT BUỘC phải có tiền tố (Project Prefix) riêng biệt (e.g. tkw_*, fml_*, lnd_*, beth_*) để tránh xung đột tên bảng khi dùng chung Supabase DB
- [ ] Tạo bảng \`public.profiles\` link với \`auth.users(id)\` qua Postgres Trigger \`on_auth_user_created\`
- [ ] Áp dụng đúng RLS Pattern: User read/write own data (\`auth.uid() = user_id\`), Admin full access
- [ ] Dùng \`supabase.channel()\` cho Realtime subscriptions và cleanup khi component unmount
- [ ] Upload file lên Supabase Storage với Bucket public/private policy phù hợp

## 7. ⚙️ Code Quality & Production Readiness
- [ ] Đạt chuẩn TypeScript strict mode (noImplicitAny, strictNullChecks)
- [ ] Sử dụng \`type-only imports\` khi bật \`verbatimModuleSyntax\`
- [ ] Có Loading state và Error boundaries cho mọi async data fetch
- [ ] Không commit file \`.env.local\` hoặc secret keys vào Git repository

## 8. 🎲 Script Data Giả Lập (Mock Seed Data)
- [ ] Tích hợp script seed database giả lập trong \`scripts/seed-mock-data.ts\` (hoặc SQL seed script)
- [ ] Tạo dữ liệu mẫu thực tế & phong phú (User/Nhân viên, Bài giảng/Khóa học, Tiến độ & Analytics monitor đầy đủ)
- [ ] Khai báo lệnh \`npm run db:seed\` trong \`package.json\` để tái tạo môi trường dữ liệu mẫu bất cứ lúc nào

## 9. 🧹 Script Dọn Dẹp & Reset Database (Fresh Deployment)
- [ ] Tích hợp script xóa sạch dữ liệu DB trong \`scripts/clean-db.ts\` (hoặc SQL TRUNCATE script)
- [ ] Xóa đúng thứ tự ràng buộc khóa ngoại (Foreign Keys) để không bị vi phạm CASCADE constraints
- [ ] Khai báo các lệnh \`npm run db:clean\` và \`npm run db:reset\` trong \`package.json\` để sẵn sàng cho Fresh Deployment
`;
    navigator.clipboard.writeText(markdown);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  }

  const sections: Section[] = [

    {
      id: 'google-auth',
      icon: '🔑',
      title: 'Google Login + Supabase Auth',
      content: (
        <div className="note-content">
          <h2>Google OAuth với Supabase Auth</h2>
          <p className="note-desc">Luồng xác thực: <strong>User → Google → Supabase Auth → App</strong>. Supabase làm OAuth broker, app không bao giờ xử lý password trực tiếp.</p>

          <h3>Kiến trúc</h3>
          <div className="note-arch-flow">
            <div className="arch-box">Browser</div>
            <div className="arch-arrow">→ signInWithOAuth</div>
            <div className="arch-box">Google</div>
            <div className="arch-arrow">→ redirect + code</div>
            <div className="arch-box arch-box-accent">Supabase Auth</div>
            <div className="arch-arrow">→ session JWT</div>
            <div className="arch-box">App</div>
          </div>

          <h3>Bước 1 — Tạo Google OAuth Credentials</h3>
          <Step n={1}>
            <p>Vào <strong>Google Cloud Console</strong> → APIs &amp; Services → Credentials → <em>Create Credentials → OAuth 2.0 Client ID</em></p>
          </Step>
          <Step n={2}>
            <p>Application type: <Tag color="#6366f1">Web application</Tag></p>
            <p>Thêm <strong>Authorized redirect URIs</strong>:</p>
            <CodeBlock lang="text" code={`https://<project-ref>.supabase.co/auth/v1/callback`} />
            <Alert type="warn">Phải thêm đúng redirect URI này, không thêm URL của app. Supabase sẽ nhận callback rồi mới redirect về app.</Alert>
          </Step>
          <Step n={3}>
            <p>Copy <Tag color="#10b981">Client ID</Tag> và <Tag color="#10b981">Client Secret</Tag></p>
          </Step>

          <h3>Bước 2 — Bật trong Supabase Dashboard</h3>
          <Step n={1}>
            <p><strong>Supabase Dashboard</strong> → Authentication → Providers → Google → Enable</p>
            <p>Điền Client ID + Client Secret từ bước trên.</p>
          </Step>
          <Step n={2}>
            <p>Thêm <strong>Redirect URLs</strong> trong Authentication → URL Configuration:</p>
            <CodeBlock lang="text" code={`https://your-app.vercel.app
http://localhost:5173`} />
          </Step>

          <h3>Bước 3 — Code phía Frontend</h3>
          <Alert type="info">Dùng <code>@supabase/supabase-js</code>. Không cần cài thêm gì cho Google OAuth.</Alert>

          <CodeBlock lang="typescript" code={`// utils/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);`} />

          <CodeBlock lang="typescript" code={`// AuthContext.tsx — signInWithGoogle
async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin, // sau login quay về app
    },
  });
}

// Lắng nghe auth state thay đổi
supabase.auth.onAuthStateChange((_event, session) => {
  const user = session?.user; // { id, email, user_metadata: { full_name, avatar_url } }
});

// Lấy session hiện tại khi app load
const { data: { session } } = await supabase.auth.getSession();`} />

          <h3>Bước 4 — Row Level Security (RLS)</h3>
          <p>Supabase dùng JWT của Auth để xác thực mọi request đến DB. Bật RLS để protect data:</p>
          <CodeBlock lang="sql" code={`-- Bật RLS cho bảng
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- User chỉ đọc được data của chính mình
CREATE POLICY "Users read own data"
  ON your_table FOR SELECT
  USING (auth.uid() = user_id);

-- User chỉ insert được data của chính mình
CREATE POLICY "Users insert own data"
  ON your_table FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Lấy email của user đang login trong SQL
SELECT auth.jwt() ->> 'email';`} />

          <Alert type="tip">
            <strong>auth.uid()</strong> trả về UUID của user đang login, tương ứng với <code>session.user.id</code> trong frontend. Luôn dùng cái này làm foreign key để link data với user.
          </Alert>

          <h3>Variables môi trường</h3>
          <CodeBlock lang="bash" code={`# .env.local
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# Anon key là PUBLIC — an toàn để expose trong frontend
# Service Role key là PRIVATE — chỉ dùng ở server/backend`} />
        </div>
      )
    },
    {
      id: 'monorepo-vercel',
      icon: '🚀',
      title: 'Monorepo trên Vercel',
      content: (
        <div className="note-content">
          <h2>Monorepo Deploy trên Vercel</h2>
          <p className="note-desc">Một repo chứa nhiều app (frontend + backend), mỗi app là 1 Vercel Project riêng trỏ vào đúng thư mục.</p>

          <h3>Cấu trúc thư mục</h3>
          <CodeBlock lang="text" code={`my-monorepo/
├── apps/
│   ├── web/          ← Frontend (React/Next.js)
│   │   ├── package.json
│   │   └── src/
│   └── api/          ← Backend (Express/NestJS/Next.js API)
│       ├── package.json
│       └── src/
├── packages/
│   └── shared/       ← Code dùng chung (types, utils)
│       └── package.json
├── package.json      ← Root workspace
└── turbo.json        ← (nếu dùng Turborepo)`} />

          <h3>Root package.json — Workspace</h3>
          <CodeBlock lang="json" code={`{
  "name": "my-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "build:web": "turbo build --filter=web",
    "build:api": "turbo build --filter=api"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}`} />

          <h3>turbo.json</h3>
          <CodeBlock lang="json" code={`{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}`} />

          <h3>Tạo Vercel Project cho từng app</h3>
          <Alert type="info">Mỗi app trong monorepo = 1 Vercel Project riêng. Deploy cùng lúc từ 1 repo.</Alert>

          <Step n={1}>
            <p>Vercel Dashboard → <strong>Add New Project</strong> → Import repo</p>
          </Step>
          <Step n={2}>
            <p>Cấu hình <strong>Root Directory</strong> = <code>apps/web</code> (chỉ trỏ vào thư mục của app đó)</p>
            <CodeBlock lang="text" code={`Root Directory:  apps/web
Framework:       Vite / Next.js / ...
Build Command:   npm run build    (hoặc turbo build --filter=web)
Output Dir:      dist             (hoặc .next cho Next.js)`} />
          </Step>
          <Step n={3}>
            <p>Lặp lại cho <code>apps/api</code> → tạo Project thứ 2</p>
            <CodeBlock lang="text" code={`Root Directory:  apps/api
Build Command:   npm run build
Output Dir:      dist`} />
          </Step>

          <h3>vercel.json — cấu hình từng app</h3>
          <CodeBlock lang="json" code={`// apps/api/vercel.json — Express/NestJS API
{
  "version": 2,
  "builds": [{ "src": "dist/main.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "dist/main.js" }]
}`} />

          <h3>Custom Domain</h3>
          <Step n={1}><p>Vercel Project → Settings → Domains → Add <code>family.minkoi.org</code></p></Step>
          <Step n={2}><p>DNS Provider → thêm CNAME record:</p>
            <CodeBlock lang="text" code={`Type:  CNAME
Name:  family
Value: cname.vercel-dns.com`} />
          </Step>
          <Step n={3}><p>Vercel tự cấp SSL certificate sau vài phút.</p></Step>

          <h3>Environment Variables cho Monorepo</h3>
          <Alert type="tip">Mỗi Vercel Project có env vars riêng. Không share giữa các project tự động.</Alert>
          <CodeBlock lang="bash" code={`# apps/web — VITE_ prefix để expose ra browser
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=https://api.family.minkoi.org

# apps/api — không cần VITE_ prefix (server-side)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # ← PRIVATE, chỉ ở server
DATABASE_URL=postgresql://...`} />

          <h3>Vercel CLI — deploy thủ công</h3>
          <CodeBlock lang="bash" code={`# Cài Vercel CLI
npm i -g vercel

# Deploy từ thư mục app cụ thể
cd apps/web && vercel --prod
cd apps/api && vercel --prod

# Hoặc dùng --cwd
vercel --cwd apps/web --prod`} />
        </div>
      )
    },
    {
      id: 'supabase-schema',
      icon: '🗄️',
      title: 'Supabase Schema chuẩn',
      content: (
        <div className="note-content">
          <h2>Supabase DB Schema chuẩn</h2>

          <h3>⚠️ Quy Tắc Đặt Tên Bảng (Project Table Prefix)</h3>
          <Alert type="warn">
            <strong>BẮT BUỘC:</strong> Khi nhiều Web App dùng chung 1 Supabase PostgreSQL Database, mọi bảng tạo mới <strong>BẮT BUỘC phải có tiền tố (Prefix) của dự án</strong> để tránh xung đột tên bảng và đè dữ liệu của nhau!
          </Alert>
          <div className="user-mgmt-table-wrap" style={{ margin: '16px 0' }}>
            <table className="user-mgmt-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Dự Án</th>
                  <th>Project Prefix</th>
                  <th style={{ textAlign: 'left' }}>Ví Dụ Bảng Tạo Trong DB</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="user-email-cell">⚡ Token Wallet</td>
                  <td><Tag color="#10b981">tkw_</Tag></td>
                  <td style={{ textAlign: 'left' }}><code>tkw_app_projects</code>, <code>tkw_user_permissions</code></td>
                </tr>
                <tr>
                  <td className="user-email-cell">🏡 Family Management</td>
                  <td><Tag color="#10b981">fml_</Tag></td>
                  <td style={{ textAlign: 'left' }}><code>fml_members</code>, <code>fml_transactions</code>, <code>fml_tasks</code></td>
                </tr>
                <tr>
                  <td className="user-email-cell">🤖 BETH (Quant Bot)</td>
                  <td><Tag color="#10b981">beth_</Tag></td>
                  <td style={{ textAlign: 'left' }}><code>beth_trades</code>, <code>beth_bot_config</code>, <code>beth_signals</code></td>
                </tr>
                <tr>
                  <td className="user-email-cell">📚 LnD Portal</td>
                  <td><Tag color="#10b981">lnd_</Tag></td>
                  <td style={{ textAlign: 'left' }}><code>lnd_employees</code>, <code>lnd_courses</code>, <code>lnd_learning_progress</code></td>
                </tr>
                <tr>
                  <td className="user-email-cell">🎓 AdmissionDecisionEngine</td>
                  <td><Tag color="#10b981">ade_</Tag></td>
                  <td style={{ textAlign: 'left' }}><code>ade_schools</code>, <code>ade_score_cutoffs</code></td>
                </tr>
                <tr>
                  <td className="user-email-cell">🎮 gameEngG10</td>
                  <td><Tag color="#10b981">g10_</Tag></td>
                  <td style={{ textAlign: 'left' }}><code>g10_students</code>, <code>g10_quizzes</code></td>
                </tr>
                <tr>
                  <td className="user-email-cell">☕ coffee_shop_24hxh</td>
                  <td><Tag color="#10b981">coffee_</Tag></td>
                  <td style={{ textAlign: 'left' }}><code>coffee_products</code>, <code>coffee_orders</code></td>
                </tr>
                <tr>
                  <td className="user-email-cell">📚 qlhs_dtnt</td>
                  <td><Tag color="#10b981">dtnt_</Tag></td>
                  <td style={{ textAlign: 'left' }}><code>dtnt_students</code>, <code>dtnt_evaluations</code></td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>Bảng users mở rộng (profile)</h3>
          <Alert type="info">Supabase có sẵn bảng <code>auth.users</code> nhưng không được chỉnh sửa trực tiếp. Tạo bảng <code>public.profiles</code> mirror sang.</Alert>
          <CodeBlock lang="sql" code={`CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  role text DEFAULT 'user',  -- 'admin' | 'user'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auto-create profile khi user đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`} />

          <h3>RLS Pattern chuẩn</h3>
          <CodeBlock lang="sql" code={`-- Pattern 1: User chỉ xem/sửa data của mình
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own posts" ON posts
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Pattern 2: Public read, authenticated write
CREATE POLICY "Public read" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Auth write" ON posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Pattern 3: Admin full access
CREATE POLICY "Admin all" ON posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );`} />

          <h3>Realtime Subscription</h3>
          <CodeBlock lang="typescript" code={`// Lắng nghe thay đổi real-time
const channel = supabase
  .channel('posts-changes')
  .on('postgres_changes', {
    event: '*',          // INSERT | UPDATE | DELETE | *
    schema: 'public',
    table: 'posts',
    filter: \`user_id=eq.\${userId}\`,
  }, (payload) => {
    console.log('Change:', payload);
  })
  .subscribe();

// Cleanup
return () => supabase.removeChannel(channel);`} />

          <h3>Storage — Upload file</h3>
          <CodeBlock lang="typescript" code={`// Upload ảnh lên Supabase Storage
const { data, error } = await supabase.storage
  .from('avatars')           // bucket name
  .upload(\`\${userId}/avatar.jpg\`, file, {
    upsert: true,
    contentType: 'image/jpeg',
  });

// Lấy public URL
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(\`\${userId}/avatar.jpg\`);`} />
        </div>
      )
    },
    {
      id: 'multi-app-auth',
      icon: '🔄',
      title: 'Dùng chung Auth & Chống Redirect Sai',
      content: (
        <div className="note-content">
          <h2>Dùng chung Supabase Auth cho Nhiều App mà Không Bị Redirect Sai</h2>
          <p className="note-desc">Khi nhiều Web App (TokenWallet, Family, BETH...) dùng chung 1 Supabase Project, người dùng đăng nhập tại App A có thể bị nhảy nhầm về Site URL mặc định nếu không cấu hình <code>redirectTo</code> và Whitelist chính xác.</p>

          <h3>Nguyên Nhân Bị Fallback Nhầm App</h3>
          <p>Mặc định trong Supabase Dashboard có một trường <strong>Site URL</strong> (ví dụ: <code>https://token-wallet-chi.vercel.app</code>). Nếu App B (<code>https://family.minkoi.org</code>) gọi <code>signInWithOAuth()</code> mà không khai báo <code>redirectTo</code> hoặc URL của App B chưa nằm trong Whitelist, Supabase sẽ <strong>tự động fallback quay về Site URL mặc định</strong> (App A).</p>

          <h3>Giải Pháp 1 — Whitelist Đủ Redirect URLs trong Supabase</h3>
          <Step n={1}>
            <p>Vào <strong>Supabase Dashboard</strong> → Authentication → URL Configuration</p>
          </Step>
          <Step n={2}>
            <p><strong>Site URL:</strong> Đặt domain chính hoặc app trung tâm (ví dụ: <code>https://token-wallet-chi.vercel.app</code>)</p>
          </Step>
          <Step n={3}>
            <p><strong>Redirect URLs (Whitelist):</strong> Thêm <em>TẤT CẢ</em> domain production + localhost của các sub-app. Dùng wildcard <code>**</code> để hỗ trợ mọi sub-route:</p>
            <CodeBlock lang="text" code={`https://family.minkoi.org/**
https://beth-theta.vercel.app/**
https://ade-flame.vercel.app/**
http://localhost:5173/**
http://localhost:3000/**`} />
          </Step>

          <h3>Giải Pháp 2 — Khai Báo Exact <code>redirectTo</code> Ở Frontend</h3>
          <Alert type="info">Luôn truyền <code>window.location.origin</code> (hoặc đường dẫn callback cụ thể) khi gọi <code>signInWithOAuth</code>.</Alert>
          <CodeBlock lang="typescript" code={`// Trong từng app cụ thể (Vite / React / Next.js)
async function handleLogin() {
  const currentOrigin = window.location.origin; // e.g., "https://family.minkoi.org" hoặc "http://localhost:5173"

  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Ép Supabase sau khi Google xác thực phải quay lại đúng domain hiện tại
      redirectTo: \`\${currentOrigin}/\`,
    },
  });
}`} />

          <h3>Giải Pháp 3 — Phân Quyền Access Theo App (App Scope Isolation)</h3>
          <p>Dùng chung 1 DB Auth nghĩa là User ID đăng nhập là duy nhất toàn hệ thống. Để kiểm soát User nào có quyền vào App nào:</p>
          <CodeBlock lang="sql" code={`-- Bảng phân quyền app cho từng user
CREATE TABLE public.user_app_access (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id text NOT NULL, -- 'app-family', 'app-tokenwallet', 'app-beth'
  is_allowed boolean DEFAULT false,
  PRIMARY KEY (user_id, app_id)
);

-- RLS Check xem user có quyền mở App hiện tại không
CREATE POLICY "Check app access" ON app_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_app_access
      WHERE user_id = auth.uid() AND app_id = 'app-family' AND is_allowed = true
    )
  );`} />
        </div>
      )
    },
    {
      id: 'local-dev-supabase',
      icon: '💻',
      title: 'Chạy Local với Remote Supabase DB',
      content: (
        <div className="note-content">
          <h2>Chạy Mọi App Ở Localhost Vẫn Kết Nối Supabase Cloud</h2>
          <p className="note-desc">Hướng dẫn cấu hình để tất cả dự án (React/Vite/Next.js/Express) chạy mượt mà ở máy cá nhân (Localhost) nhưng kết nối trực tiếp DB & Auth trên Supabase Cloud mà không lo lỗi CORS hay OAuth fail.</p>

          <h3>Cấu Trúc Env File Chuẩn Cho Localhost</h3>
          <p>Mỗi dự án cần file <code>.env.local</code> (không commit vào Git) để ghi đè các biến môi trường kết nối Supabase Cloud:</p>

          <CodeBlock lang="bash" code={`# .env.local trong dự án Vite / React
VITE_SUPABASE_URL=https://xzmqeibqvgrthuisghvu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1Ni...

# .env.local trong dự án Node.js / Express Backend
SUPABASE_URL=https://xzmqeibqvgrthuisghvu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1Ni...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1Ni... # Dùng cho backend admin/cron job`} />

          <h3>Bước 1 — Thêm Localhost Vào Whitelist Redirect URLs</h3>
          <Alert type="warn">Nếu quên bước này, khi ấn "Login Google" ở <code>localhost:5173</code>, trình duyệt sẽ bị chuyển hướng sang domain production thay vì ở lại localhost!</Alert>
          <p>Trong <strong>Supabase Dashboard → Auth → URL Configuration → Redirect URLs</strong>, thêm các URL local:</p>
          <CodeBlock lang="text" code={`http://localhost:5173/**
http://localhost:3000/**
http://127.0.0.1:5173/**`} />

          <h3>Bước 2 — Cấu Hình CORS Cho Local Node.js Backend</h3>
          <p>Nếu dự án có backend Express / NestJS chạy local kết nối Supabase, cần cho phép Frontend Localhost gọi API mà không bị chặn CORS:</p>
          <CodeBlock lang="typescript" code={`// Express Backend (apps/api/src/index.ts)
import cors from 'cors';
import express from 'express';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://family.minkoi.org',
  'https://token-wallet-chi.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS blocked for origin: ' + origin));
    }
  },
  credentials: true
}));`} />

          <h3>Bước 3 — Test Quy Trình Login ở Localhost</h3>
          <Step n={1}>
            <p>Khởi chạy app local: <code>npm run dev</code> (thường chạy tại <code>http://localhost:5173</code>)</p>
          </Step>
          <Step n={2}>
            <p>Bấm nút <strong>Đăng nhập với Google</strong>. Trình duyệt mở trang chọn tài khoản Google.</p>
          </Step>
          <Step n={3}>
            <p>Sau khi chọn tài khoản, Google chuyển về Supabase Auth → Supabase Auth đọc <code>redirectTo: http://localhost:5173/</code> → Trình duyệt nhảy về lại <code>localhost:5173</code> với đầy đủ Session token.</p>
          </Step>

          <Alert type="tip">
            <strong>Kinh nghiệm:</strong> Bạn có thể dùng 1 Supabase Project cho cả Dev Local lẫn Production. Nhờ RLS và <code>auth.uid()</code>, dữ liệu giữa các môi trường vẫn được bảo vệ tuyệt đối an toàn.
          </Alert>
        </div>
      )
    },
    {
      id: 'local-ports',
      icon: '🔌',
      title: 'Quy Hoạch Port Cố Định Local',
      content: (
        <div className="note-content">
          <h2>Quy Hoạch Port Cố Định Khi Chạy Nhiều App Local (Không Dùng Docker)</h2>
          <p className="note-desc">Khi phát triển nhiều app cùng lúc trên máy local không qua Docker, việc cấu hình port cố định cho từng Frontend/Backend giúp tránh xung đột port, nhảy port ngẫu nhiên làm hỏng Google OAuth Redirect & CORS.</p>

          <h3>Vì Sao Cần Port Cố Định & Strict Port?</h3>
          <p>Mặc định Vite/Next.js sẽ tự động tăng port (ví dụ: <code>5173</code> → <code>5174</code> → <code>5175</code>) nếu port gốc bị chiếm. Điều này gây ra 2 lỗi nghiêm trọng:</p>
          <div className="note-checklist">
            <label className="checklist-item"><span>1. <strong>OAuth Redirect Error:</strong> Google/Supabase Auth nhảy về port cũ <code>5173</code> thay vì port mới <code>5174</code>.</span></label>
            <label className="checklist-item"><span>2. <strong>CORS Error:</strong> Backend Express chỉ cho phép <code>localhost:5173</code> gọi API, khi Frontend tự đổi thành <code>5174</code> sẽ bị chặn CORS ngay.</span></label>
          </div>

          <h3>Bảng Quy Hoạch Port Chuẩn Danh Mục App</h3>
          <div className="user-mgmt-table-wrap" style={{ margin: '16px 0' }}>
            <table className="user-mgmt-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Tên App</th>
                  <th>Frontend Local Port</th>
                  <th>Backend API Local Port</th>
                  <th>Cấu Hình Config</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="user-email-cell">⚡ Token Wallet</td>
                  <td><Tag color="#10b981">http://localhost:5173</Tag></td>
                  <td><Tag color="#64748b">N/A (Frontend Only)</Tag></td>
                  <td>Vite (strictPort)</td>
                </tr>
                <tr>
                  <td className="user-email-cell">🏡 Family Management</td>
                  <td><Tag color="#10b981">http://localhost:5174</Tag></td>
                  <td><Tag color="#6366f1">http://localhost:5001</Tag></td>
                  <td>Vite + Express Monorepo</td>
                </tr>
                <tr>
                  <td className="user-email-cell">🤖 BETH (Quant Bot)</td>
                  <td><Tag color="#10b981">http://localhost:5175</Tag></td>
                  <td><Tag color="#6366f1">http://localhost:5002</Tag></td>
                  <td>Next.js (-p 5175)</td>
                </tr>
                <tr>
                  <td className="user-email-cell">🎮 gameEngG10</td>
                  <td><Tag color="#10b981">http://localhost:5176</Tag></td>
                  <td><Tag color="#6366f1">http://localhost:5003</Tag></td>
                  <td>Vite + Express</td>
                </tr>
                <tr>
                  <td className="user-email-cell">🎓 AdmissionDecisionEngine</td>
                  <td><Tag color="#10b981">http://localhost:5177</Tag></td>
                  <td><Tag color="#6366f1">http://localhost:5004</Tag></td>
                  <td>Vite + NestJS</td>
                </tr>
                <tr>
                  <td className="user-email-cell">☕ coffee_shop_24hxh</td>
                  <td><Tag color="#10b981">http://localhost:5178</Tag></td>
                  <td><Tag color="#6366f1">http://localhost:5005</Tag></td>
                  <td>Vite + NestJS</td>
                </tr>
                <tr>
                  <td className="user-email-cell">📚 qlhs_dtnt</td>
                  <td><Tag color="#10b981">http://localhost:5179</Tag></td>
                  <td><Tag color="#6366f1">http://localhost:5006</Tag></td>
                  <td>Vite + Express</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>1. Khóa Port Cố Định Trong Vite (<code>vite.config.ts</code>)</h3>
          <p>Dùng thuộc tính <code>strictPort: true</code> để ép Vite báo lỗi ngay nếu port đang bị chiếm, không tự ý đổi port:</p>
          <CodeBlock lang="typescript" code={`// vite.config.ts (ví dụ cho Family Management - Port 5174)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true, // Ép không nhảy sang 5175 nếu 5174 đang bận
  },
});`} />

          <h3>2. Khóa Port Cố Định Trong Next.js (<code>package.json</code>)</h3>
          <CodeBlock lang="json" code={`// package.json (ví dụ cho BETH App - Port 5175)
"scripts": {
  "dev": "next dev -p 5175",
  "build": "next build",
  "start": "next start -p 5175"
}`} />

          <h3>3. Cấu Hình Port cho Express / NestJS Backend (<code>.env.local</code>)</h3>
          <CodeBlock lang="typescript" code={`// apps/api/src/index.ts
const PORT = process.env.PORT || 5001; // Port riêng cho Backend từng App

app.listen(PORT, () => {
  console.log(\`Backend API running on http://localhost:\${PORT}\`);
});`} />

          <h3>4. Khai Báo Danh Sách Port vào Supabase Auth Redirect Whitelist</h3>
          <Alert type="tip">Thêm toàn bộ dải port từ 5173 đến 5179 vào Supabase Dashboard → Auth → URL Configuration để mọi App Local đều đăng nhập mượt mà!</Alert>
          <CodeBlock lang="text" code={`http://localhost:5173/**
http://localhost:5174/**
http://localhost:5175/**
http://localhost:5176/**
http://localhost:5177/**
http://localhost:5178/**
http://localhost:5179/**`} />
        </div>
      )
    },
    {
      id: 'mock-data-script',
      icon: '🎲',
      title: 'Script Seed & Giả Lập Data',
      content: (
        <div className="note-content">
          <h2>Tạo Script Seed Data Giả Lập Cho Mỗi Ứng Dụng (Mock Data Generator)</h2>
          <p className="note-desc">Mọi ứng dụng (đặc biệt là các hệ thống quản trị như LnD Portal, Family, TokenWallet...) <strong>bắt buộc phải có một bộ script seed data giả lập tự động</strong>. Script này sinh ra dữ liệu phong phú để phục vụ kiểm thử UI/UX, đo đạc thông số monitor và demo sản phẩm mà không phụ thuộc data thật.</p>

          <h3>Ví Dụ Thực Tế Cho App L&amp;D Portal (<code>LnD_Portal</code>)</h3>
          <div className="note-checklist">
            <label className="checklist-item"><span>👥 <strong>Nhân viên (Employees):</strong> Tự sinh danh sách 50–100 nhân viên đầy đủ Tên, Email, Phòng ban (HR, Tech, Sales) và Chức danh.</span></label>
            <label className="checklist-item"><span>📚 <strong>Bài giảng &amp; Khóa học (Lectures &amp; Courses):</strong> Tự sinh danh mục khóa học Bắt buộc, Kỹ năng mềm, Chuyên môn kèm tài liệu.</span></label>
            <label className="checklist-item"><span>🎯 <strong>Chương trình đào tạo (Training Programs):</strong> Phân bổ nhân viên vào các lộ trình học tập theo quý/năm.</span></label>
            <label className="checklist-item"><span>📊 <strong>Tiến độ &amp; Monitor (Learning Logs &amp; Progress):</strong> Tạo lịch sử học tập, thời lượng học, điểm thi, chứng chỉ để Dashboard Monitor vẽ biểu đồ chân thực.</span></label>
          </div>

          <h3>Code Mẫu TypeScript Seed Script (<code>scripts/seed-mock-data.ts</code>)</h3>
          <CodeBlock lang="typescript" code={`// scripts/seed-mock-data.ts
import { supabase } from '../src/utils/supabaseClient';

async function seedMockData() {
  console.log('🌱 Starting Mock Data Seeding...');

  // 1. Seed Employees
  const employees = Array.from({ length: 30 }, (_, i) => ({
    id: \`emp-\${i + 1}\`,
    full_name: \`Nguyễn Văn Employee \${i + 1}\`,
    email: \`employee\${i + 1}@company.com\`,
    department: ['Engineering', 'Product', 'HR', 'Finance'][i % 4],
    role: i === 0 ? 'manager' : 'staff',
  }));
  await supabase.from('lnd_employees').upsert(employees);

  // 2. Seed Courses & Lectures
  const courses = [
    { id: 'course-1', title: 'An Toàn Thông Tin & Security 2026', category: 'Bắt buộc' },
    { id: 'course-2', title: 'Kỹ Năng Quản Lý Dự Án Agile/Scrum', category: 'Chuyên môn' },
    { id: 'course-3', title: 'Giao Tiếp & Làm Việc Nhóm Hiệu Quả', category: 'Kỹ năng mềm' },
  ];
  await supabase.from('lnd_courses').upsert(courses);

  // 3. Seed Learning Progress & Monitoring Logs
  const progressLogs = employees.flatMap(emp =>
    courses.map(c => ({
      employee_id: emp.id,
      course_id: c.id,
      progress_percent: Math.floor(Math.random() * 100),
      is_completed: Math.random() > 0.4,
      score: Math.floor(Math.random() * 40) + 60,
      last_active_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000)).toISOString(),
    }))
  );
  await supabase.from('lnd_learning_progress').upsert(progressLogs);

  console.log('✅ Mock Data Seeding Complete!');
}

seedMockData().catch(console.error);`} />

          <h3>Script Dọn Dẹp / Reset Database (Sẵn Sàng Cho Fresh Deployment)</h3>
          <p>Bên cạnh seed data, ứng dụng <strong>bắt buộc phải có một script dọn dẹp sạch toàn bộ dữ liệu</strong> (<code>scripts/clean-db.ts</code>). Script này xóa dữ liệu thử nghiệm theo đúng thứ tự khóa ngoại (foreign keys) để trả DB về trạng thái trắng (Zero Data), sẵn sàng cho việc <strong>Fresh Deployment / Handoff bàn giao sản phẩm</strong>.</p>

          <CodeBlock lang="typescript" code={`// scripts/clean-db.ts
import { supabase } from '../src/utils/supabaseClient';

async function cleanDatabase() {
  console.log('🧹 Cleaning Database for Fresh Deployment...');

  // Xóa theo thứ tự ngược lại của ràng buộc khóa ngoại (Foreign Keys)
  await supabase.from('lnd_learning_progress').delete().neq('id', 'non_existent');
  await supabase.from('lnd_courses').delete().neq('id', 'non_existent');
  await supabase.from('lnd_employees').delete().neq('id', 'non_existent');

  console.log('✨ Database Reset Successfully! Ready for Fresh Deployment.');
}

cleanDatabase().catch(console.error);`} />

          <h3>Cấu Hình Commands Trong <code>package.json</code></h3>
          <CodeBlock lang="json" code={`// package.json
"scripts": {
  "db:seed": "tsx scripts/seed-mock-data.ts",
  "db:clean": "tsx scripts/clean-db.ts",
  "db:reset": "npm run db:clean && npm run db:seed"
}`} />

          <Alert type="tip">
            • <code>npm run db:seed</code> — Tạo lại toàn bộ dữ liệu mẫu giả lập.<br />
            • <code>npm run db:clean</code> — Xóa sạch toàn bộ dữ liệu, đưa DB về 0 để sẵn sàng cho Fresh Deployment.<br />
            • <code>npm run db:reset</code> — Dọn dẹp sạch rồi seed lại data giả lập mới.
          </Alert>
        </div>
      )
    },
    {
      id: 'webapp-checklist',
      icon: '✅',
      title: 'Checklist Web App chuẩn',
      content: (
        <div className="note-content">
          <h2>Checklist Web App Production-Ready</h2>

          <h3>🔐 Authentication</h3>
          <div className="note-checklist">
            {[
              'Google OAuth qua Supabase (không tự build auth)',
              'onAuthStateChange để sync session toàn app',
              'Redirect về đúng page sau login (redirectTo)',
              'Sign out xóa session + clear local state',
              'Protected routes kiểm tra session trước khi render',
              'RLS bật cho mọi bảng chứa data user',
            ].map(item => <label key={item} className="checklist-item"><input type="checkbox" /><span>{item}</span></label>)}
          </div>

          <h3>🚀 Deployment (Vercel)</h3>
          <div className="note-checklist">
            {[
              'Root Directory đúng với từng app trong monorepo',
              'Env vars set đủ trong Vercel Dashboard (không commit .env)',
              'VITE_ prefix cho biến expose ra browser',
              'Custom domain + CNAME record đúng',
              'Preview Deployments cho mỗi PR',
              'vercel.json cho Node.js/Express API',
            ].map(item => <label key={item} className="checklist-item"><input type="checkbox" /><span>{item}</span></label>)}
          </div>

          <h3>🗄️ Supabase</h3>
          <div className="note-checklist">
            {[
              'Mọi bảng DB tạo mới bắt buộc phải có Project Prefix riêng (tkw_*, fml_*, lnd_*, beth_*)',
              'RLS bật cho mọi bảng (mặc định Supabase tắt RLS)',
              'Dùng anon key ở frontend, service_role key chỉ ở server',
              'Trigger auto-create profile khi user mới đăng ký',
              'Index trên cột filter thường dùng (user_id, created_at)',
              'Backup policy (Point-in-Time Recovery cho Pro plan)',
              'Supabase Auth Redirect URLs whitelist đủ domain',
            ].map(item => <label key={item} className="checklist-item"><input type="checkbox" /><span>{item}</span></label>)}
          </div>

          <h3>🎲 Seed &amp; Clean Data (Fresh Deployment)</h3>
          <div className="note-checklist">
            {[
              'Có script seed mock data trong scripts/seed-mock-data.ts',
              'Có script clean db trong scripts/clean-db.ts (Xóa đúng thứ tự Foreign Key)',
              'Tự sinh đầy đủ Nhân viên, Khóa học, Tiến độ & Nhật ký monitor',
              'Khai báo đầy đủ db:seed, db:clean, db:reset trong package.json',
            ].map(item => <label key={item} className="checklist-item"><input type="checkbox" /><span>{item}</span></label>)}
          </div>

          <h3>⚙️ Code Quality</h3>
          <div className="note-checklist">
            {[
              'TypeScript strict mode (noImplicitAny, strictNullChecks)',
              'ESLint + Prettier config',
              'type-only imports khi dùng verbatimModuleSyntax',
              'Error boundaries cho React',
              'Loading + empty states cho mọi async data',
              '.env.example commit vào repo (không commit .env.local)',
            ].map(item => <label key={item} className="checklist-item"><input type="checkbox" /><span>{item}</span></label>)}
          </div>

          <h3>Lệnh khởi tạo nhanh</h3>
          <CodeBlock lang="bash" code={`# Tạo monorepo với Turborepo
npx create-turbo@latest my-app
cd my-app

# Hoặc Vite + React
npm create vite@latest apps/web -- --template react-ts

# Cài Supabase client
npm install @supabase/supabase-js

# Cài react-router
npm install react-router-dom`} />
        </div>
      )
    }
  ];

  const active = sections.find(s => s.id === activeSection)!;

  return (
    <div className="notes-page">
      <aside className="notes-sidebar">
        <div className="notes-sidebar-title">📝 Ghi Chú Kỹ Thuật</div>
        <div style={{ padding: '0 12px 12px' }}>
          <button
            className={`btn-copy-all-checklist ${copiedAll ? 'copied' : ''}`}
            onClick={copyFullChecklist}
            title="Copy toàn bộ ghi chú dưới dạng Markdown Checklist để cấp cho AI / Agent Audit code dự án"
          >
            {copiedAll ? '✓ Copied Full Checklist!' : '📋 Copy Audit Checklist'}
          </button>
        </div>
        <nav>
          {sections.map(s => (
            <button
              key={s.id}
              className={`notes-nav-btn ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              <span>{s.icon}</span>
              <span>{s.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="notes-main">
        {active.content}
      </main>
    </div>
  );
}
