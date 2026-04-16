import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcrypt'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'
import { eq } from 'drizzle-orm'
import 'dotenv/config'
import { products, admins, guides } from '../src/db/schema.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const db   = drizzle(pool)

// Run migrations first
console.log('📦 Running migrations...')
// dev: __dirname = /app/scripts  → ../drizzle = /app/drizzle
// prod: __dirname = /app/dist/scripts → ../../drizzle = /app/drizzle
await migrate(db, { migrationsFolder: resolve(__dirname, '../../drizzle') })

// ── Seed products from CSV ──────────────────────────────────────────────────
const [existingProduct] = await db.select().from(products).limit(1)
if (!existingProduct) {
  console.log('🌱 Seeding products from CSV...')
  const csvPath = resolve(__dirname, '../../data/products.csv')
  const csv     = readFileSync(csvPath, 'utf-8').trim()
  const lines   = csv.split('\n')
  const headers = lines[0].split(',').map((h) => h.trim())

  const rows = lines.slice(1).map((line) => {
    const vals = line.split(',').map((v) => v.trim())
    return Object.fromEntries(headers.map((h, i) => [h, vals[i]]))
  })

  await db.insert(products).values(
    rows.map((r) => ({
      name:        r.name,
      description: r.description ?? '',
      price:       parseInt(r.price),
      image:       r.image ?? '',
      stock:       parseInt(r.stock) || 0,
      category:    r.category ?? 'Khác',
      groupKey:    r.group_key ?? '',
    })),
  )
  console.log(`✅ Inserted ${rows.length} products`)
} else {
  console.log('⏭  Products already seeded, skipping')
}

// ── Seed admin ──────────────────────────────────────────────────────────────
const adminPassword = process.env.ADMIN_PASSWORD
if (!adminPassword) {
  console.warn('⚠️  ADMIN_PASSWORD not set, skipping admin seed')
} else {
  const [existingAdmin] = await db.select().from(admins).where(eq(admins.username, 'admin'))
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12)
    await db.insert(admins).values({ username: 'admin', passwordHash })
    console.log('✅ Admin user created (username: admin)')
  } else {
    console.log('⏭  Admin already exists, skipping')
  }
}

// ── Seed guides ─────────────────────────────────────────────────────────────
const [existingGuide] = await db.select().from(guides).limit(1)
if (!existingGuide) {
  console.log('🌱 Seeding guides...')
  await db.insert(guides).values([
    {
      sortOrder: 1,
      type: 'Join Family Office 365',
      descriptionVi: `📝 Cách tham gia Family Office 365

✅ Đầu tiên, bạn check xem đã có family từ trước chưa (nếu đã có family từ trước thì hãy rời family) → check tại: https://account.microsoft.com/family/home

‼ Bấm vào dấu 3 chấm ở trên avatar sau đó chọn Leave family (rời nhóm)

2️⃣ Nếu không có FAMILY thì bạn check mail (sẽ có mail mời tham gia nhóm) bấm Get Started (nút màu xanh trong mail mời). Tham gia thành công thì vào office.com xem có gói đăng ký (family) chưa. Nếu tham gia báo lỗi / không thấy mail hãy báo shop để gửi link tham gia family.`,
      descriptionEn: `📝 How to Join Family Office 365

✅ First, check if you already have a family group (if so, leave it first) → Check at: https://account.microsoft.com/family/home

‼ Click the three-dot menu next to your avatar, then select Leave family.

2️⃣ If you don't have a FAMILY yet, check your email for a family invitation and click Get Started (the blue button in the invite email). After joining, visit office.com to confirm the Family subscription is active. If you get an error or don't receive the email, contact the shop for a direct family invite link.`,
      descriptionCn: `📝 如何加入 Family Office 365

✅ 首先，检查您是否已在某个家庭组中（如有，请先退出）→ 查看地址：https://account.microsoft.com/family/home

‼ 点击头像旁边的三点菜单，选择「Leave family（离开家庭组）」。

2️⃣ 如果您还没有家庭组，请查收邮件中的家庭邀请，点击「Get Started」（邮件中的蓝色按钮）。加入成功后，访问 office.com 确认家庭订阅已激活。如遇错误或未收到邮件，请联系店铺获取直接邀请链接。`,
    },
    {
      sortOrder: 2,
      type: 'Tham gia Family Google / Gemini / YouTube',
      descriptionVi: `📝 Lưu ý một số lỗi khi tham gia family Google và cách khắc phục (YouTube - Gemini - Google One)

Nếu không gặp lỗi, quý khách chỉ cần tham gia Family như bình thường bằng cách mở email và chấp nhận lời mời.

1️⃣ Xử lý lỗi: Không nhận được email hoặc đang thuộc nhóm gia đình khác
- Truy cập: https://myaccount.google.com/people-and-sharing
- Kiểm tra xem có đang thuộc nhóm gia đình khác không.
- Nếu có, kéo xuống cuối trang và chọn Thoát/Rời nhóm gia đình.
- Sau đó quay lại email và nhấp Chấp nhận lời mời.

2️⃣ Xử lý lỗi: Không cùng quốc gia
- Truy cập: https://payments.google.com
- Nhấp biểu tượng ba gạch ngang bên trái → chọn Cài đặt (Settings) (KHÔNG chọn "Phương thức thanh toán").
- Kéo xuống cuối trang → chọn Đóng toàn bộ hồ sơ thanh toán.
- Quay lại email và nhấp Chấp nhận lời mời 2–3 lần nếu cần.

⚠️ Lưu ý quan trọng (thường gặp khi tham gia bằng điện thoại): Lỗi quốc gia cũng có thể xuất phát từ việc tài khoản vẫn còn trong nhóm gia đình cũ. Cần đảm bảo đã rời khỏi nhóm cũ trước khi thử lại.

📌 Nếu nhận được thông báo "Chỉ có thể đổi nhóm Family sau 12 tháng", vui lòng sử dụng một email khác để tham gia hoặc liên hệ shop để fix lỗi (có tốn phí).`,
      descriptionEn: `📝 Troubleshooting guide for joining Google Family (YouTube - Gemini - Google One)

If everything is fine, simply open the invitation email and accept it.

1️⃣ Error: No invitation email / already in another family group
- Visit: https://myaccount.google.com/people-and-sharing
- Check if you are in another family group.
- If yes, scroll to the bottom and select Leave family group.
- Then return to your email and click Accept invitation.

2️⃣ Error: Different country
- Visit: https://payments.google.com
- Click the three-line icon on the left → select Settings (NOT "Payment methods").
- Scroll down → select Close all payment profiles.
- Return to email and click Accept invitation 2–3 times if needed.

⚠️ Important (common on mobile): The country error may also appear if your account is still linked to an old family group, even after closing the payment profile. Leave the old group first.

📌 If you see "You can only change Family groups after 12 months", please use a different email or contact the shop to resolve it (additional fee applies).`,
      descriptionCn: `📝 加入 Google Family 常见问题及解决方法（YouTube - Gemini - Google One）

如无问题，直接打开邀请邮件并接受即可。

1️⃣ 错误：未收到邀请邮件 / 已在其他家庭组中
- 访问：https://myaccount.google.com/people-and-sharing
- 检查您是否在其他家庭组中。
- 若有，滚动到页面底部，选择「退出家庭组」。
- 然后返回邮件，点击「接受邀请」。

2️⃣ 错误：国家/地区不同
- 访问：https://payments.google.com
- 点击左侧三条横线图标 → 选择「设置」（不要选择「付款方式」）。
- 滚动到页面底部 → 选择「关闭所有付款账号」。
- 返回邮件，点击「接受邀请」，如有需要重复 2–3 次。

⚠️ 重要提示（手机操作时常见）：即使关闭了付款账号，如果仍在旧家庭组中，也可能出现国家错误。请先确认已退出旧家庭组。

📌 如显示「只能在 12 个月后更改家庭组」，请使用其他邮箱加入，或联系店铺修复（需额外收费）。`,
    },
    {
      sortOrder: 3,
      type: 'Thay đổi Email trên CapCut',
      descriptionVi: `💡 Hướng dẫn thay đổi Email trên ứng dụng CapCut (Điện thoại)

✅ Bước 1: Mở ứng dụng CapCut.
✅ Bước 2: Nhấn vào tab Tôi (biểu tượng hình người) ở góc dưới cùng bên phải.
✅ Bước 3: Nhấn vào biểu tượng ba dấu gạch ngang (Menu) hoặc biểu tượng hình lục giác (Cài đặt) ở góc trên cùng bên phải.
✅ Bước 4: Chọn mục Quản lý tài khoản.
✅ Bước 5: Tại dòng Email, nhấn trực tiếp vào địa chỉ email hiện tại.
✅ Bước 6: CapCut sẽ gửi mã xác minh (OTP) về email đang đăng nhập → liên hệ shop để nhận mã.
✅ Bước 7: Nhập địa chỉ Email mới bạn muốn chuyển qua.
✅ Bước 8: Nhập mã xác minh được gửi về email mới để hoàn tất.

‼ Các tài khoản CapCut bên mình cung cấp, bạn nên chủ động change mail để đảm bảo bảo mật khi sử dụng lâu dài và tránh lộ dữ liệu cá nhân.`,
      descriptionEn: `💡 How to Change Email on CapCut (Mobile App)

✅ Step 1: Open the CapCut app.
✅ Step 2: Tap the Me tab (person icon) at the bottom right.
✅ Step 3: Tap the three-line menu icon or the settings (gear/hexagon) icon at the top right.
✅ Step 4: Select Account Management.
✅ Step 5: Tap directly on the current email address shown.
✅ Step 6: CapCut will send a verification code (OTP) to the currently linked email → contact the shop to receive this code.
✅ Step 7: Enter the new email address you want to switch to.
✅ Step 8: Enter the verification code sent to the new email to complete the change.

‼ For CapCut accounts provided by the shop, we recommend changing the email proactively to ensure long-term security and protect your personal data.`,
      descriptionCn: `💡 如何在 CapCut 应用中更改邮箱（手机端）

✅ 第1步：打开 CapCut 应用。
✅ 第2步：点击右下角的「我」标签（人形图标）。
✅ 第3步：点击右上角的三条横线菜单图标或设置图标。
✅ 第4步：选择「账号管理」。
✅ 第5步：直接点击当前显示的邮箱地址。
✅ 第6步：CapCut 将向当前绑定邮箱发送验证码（OTP）→ 联系店铺获取验证码。
✅ 第7步：输入您想切换的新邮箱地址。
✅ 第8步：输入发送至新邮箱的验证码，完成更改。

‼ 对于店铺提供的 CapCut 账号，建议您主动更换邮箱，以确保长期使用的安全性，并避免个人数据泄露。`,
    },
    {
      sortOrder: 4,
      type: 'Chuyển nhóm Family Google',
      descriptionVi: `📝 Hướng dẫn chuyển đổi nhóm gia đình Google

Bước 1: Rời nhóm cũ
- Truy cập: https://families.google/families/
- Bấm vào nhóm gia đình hiện tại → chọn tên của bạn → chọn Rời khỏi nhóm.

Bước 2: Tham gia nhóm mới
- Truy cập lại: https://families.google/families/
- Bấm Xem lời mời → bấm Đồng ý tham gia nhóm.`,
      descriptionEn: `📝 How to Switch Google Family Groups

Step 1: Leave the current group
- Visit: https://families.google/families/
- Click on your current family group → select your name → select Leave group.

Step 2: Join the new group
- Visit again: https://families.google/families/
- Click View invitation → click Accept to join the new group.`,
      descriptionCn: `📝 如何切换 Google 家庭组

第1步：退出当前家庭组
- 访问：https://families.google/families/
- 点击当前家庭组 → 选择您的姓名 → 选择「退出家庭组」。

第2步：加入新家庭组
- 重新访问：https://families.google/families/
- 点击「查看邀请」 → 点击「同意加入家庭组」。`,
    },
    {
      sortOrder: 5,
      type: 'Lưu ý khi sử dụng Zoom Pro',
      descriptionVi: `✨ Vài lưu ý quan trọng khi sử dụng Zoom Pro

🔑 Về mật khẩu tài khoản:
- Vui lòng không thay đổi mật khẩu trong thời gian sử dụng. Nếu có thay đổi, hãy báo lại mật khẩu mới cho shop để hỗ trợ khi cần.

📲 Về xác thực hai yếu tố (2FA):
- Nếu màn hình yêu cầu xác thực 2 yếu tố, chỉ cần chọn "Bỏ qua" (Skip) và tiếp tục vào phòng họp.
- Không thêm số điện thoại hoặc ứng dụng xác thực vào tài khoản để đảm bảo shop có thể hỗ trợ bảo hành, bảo trì.`,
      descriptionEn: `✨ Important Notes When Using Zoom Pro

🔑 Account Password:
- Please do not change the password while your subscription is active. If you do change it, notify the shop of the new password so we can assist you if needed.

📲 Two-Factor Authentication (2FA):
- If the screen asks for 2FA, simply select "Skip" and continue into the meeting room.
- Do not add a phone number or authentication app to the account, so the shop can continue providing warranty and maintenance support.`,
      descriptionCn: `✨ 使用 Zoom Pro 的重要注意事项

🔑 账号密码：
- 请在订阅期间不要更改密码。如果更改了密码，请将新密码告知店铺，以便在需要时提供支持。

📲 双重身份验证（2FA）：
- 如果屏幕要求进行双重验证，只需选择「跳过」（Skip），继续进入会议室即可。
- 请勿向账号添加手机号码或身份验证应用，以便店铺能够继续提供保修和维护支持。`,
    },
    {
      sortOrder: 6,
      type: 'Sử dụng dung lượng iCloud gia đình',
      descriptionVi: `📱 Hướng dẫn sử dụng dung lượng iCloud từ gói gia đình

Sau khi đã tham gia nhóm gia đình (Family) thành công, thực hiện các bước sau:

1. Vào Cài đặt (Settings)
2. Nhấn vào Apple ID / tên của bạn ở trên cùng
3. Chọn iCloud
4. Chọn Quản lý dung lượng (Manage Storage)
5. Chọn Sử dụng dung lượng gia đình (Use Family Storage)

Sau đó dung lượng iCloud của bạn sẽ được cộng từ gói gia đình.`,
      descriptionEn: `📱 How to Use iCloud Storage from Family Plan

After successfully joining the Family group, follow these steps:

1. Open Settings
2. Tap your Apple ID / name at the top
3. Select iCloud
4. Select Manage Storage
5. Select Use Family Storage

Your iCloud storage will then draw from the shared family plan.`,
      descriptionCn: `📱 如何使用家庭计划中的 iCloud 存储

成功加入家庭组后，按照以下步骤操作：

1. 打开「设置」
2. 点击顶部的 Apple ID / 您的姓名
3. 选择「iCloud」
4. 选择「管理存储空间」
5. 选择「使用家庭存储空间」

之后，您的 iCloud 存储空间将从共享的家庭计划中扣除。`,
    },
    {
      sortOrder: 7,
      type: 'Gỡ liên kết Duolingo (Google / Facebook)',
      descriptionVi: `🔗 Hướng dẫn gỡ liên kết Google/Facebook khỏi tài khoản Duolingo

Xem hướng dẫn chi tiết tại:
https://docs.google.com/document/d/1ZezmlEI2RB5LpPOW-f4JbKz-ZkBTpw9Yl_hMeaRZx1A/edit?usp=sharing

Lưu ý: Sau khi gỡ liên kết, bạn có thể đăng nhập bằng email và mật khẩu riêng thay vì tài khoản Google/Facebook.`,
      descriptionEn: `🔗 How to Unlink Google/Facebook from Duolingo Account

See the detailed guide at:
https://docs.google.com/document/d/1ZezmlEI2RB5LpPOW-f4JbKz-ZkBTpw9Yl_hMeaRZx1A/edit?usp=sharing

Note: After unlinking, you can log in using your own email and password instead of Google/Facebook.`,
      descriptionCn: `🔗 如何解除 Duolingo 账号与 Google/Facebook 的关联

请查看详细指南：
https://docs.google.com/document/d/1ZezmlEI2RB5LpPOW-f4JbKz-ZkBTpw9Yl_hMeaRZx1A/edit?usp=sharing

注意：解除关联后，您可以使用自己的邮箱和密码登录，而无需使用 Google/Facebook 账号。`,
    },
    {
      sortOrder: 8,
      type: 'Hướng dẫn Adobe (Join Team, Xóa Crack, Cài App)',
      descriptionVi: `🎨 Toàn bộ hướng dẫn Adobe (Join team, xóa crack, cài app)

Xem hướng dẫn đầy đủ tại:
https://adobe.hdsd.net/huong-dan

Bao gồm:
- Cách tham gia team Adobe
- Gỡ bỏ phần mềm Adobe crack trước đó
- Cài đặt các ứng dụng Adobe chính hãng (Photoshop, Premiere, Illustrator, v.v.)`,
      descriptionEn: `🎨 Complete Adobe Guide (Join Team, Remove Crack, Install Apps)

See the full guide at:
https://adobe.hdsd.net/huong-dan

Includes:
- How to join the Adobe team
- Remove previously cracked Adobe software
- Install official Adobe applications (Photoshop, Premiere, Illustrator, etc.)`,
      descriptionCn: `🎨 Adobe 完整使用指南（加入团队、删除破解版、安装应用）

请查看完整指南：
https://adobe.hdsd.net/huong-dan

包括：
- 如何加入 Adobe 团队
- 删除之前安装的破解版 Adobe 软件
- 安装正版 Adobe 应用程序（Photoshop、Premiere、Illustrator 等）`,
    },
  ])
  console.log('✅ Inserted 8 guides')
} else {
  console.log('⏭  Guides already seeded, skipping')
}

await pool.end()
console.log('🎉 Seed complete')
