<script setup lang="ts">
/**
 * 新员工入职登记表演示页 — 使用 Element Plus 组件，覆盖所有 page-controller 测试场景
 * Employee Onboarding Form demo page — uses Element Plus components, covers all page-controller test scenarios
 *
 * 测试覆盖 / Test coverage:
 * - ElInput: text, email, tel, number
 * - ElDatePicker: 日期选择
 * - ElSelect: 部门下拉（联动岗位）/ department dropdown (cascading position)
 * - ElRadioGroup: 员工类型（联动字段显隐）/ employee type (cascading field visibility)
 * - ElCheckboxGroup: 技能标签
 * - ElSwitch: 是否需要设备
 * - ElInputNumber: 数字输入
 * - ElInput textarea: 备注
 * - ElCheckbox: 协议
 * - ElButton: 提交/重置
 */
import { ref, computed, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

// 表单引用 / Form reference
const formRef = ref<FormInstance>()

// 页面状态：form=填写中, summary=提交成功 / Page state: form=editing, summary=submitted
const pageState = ref<'form' | 'summary'>('form')

// 表单数据 / Form data
const form = reactive({
  fullName: '',
  email: '',
  phone: '',
  age: undefined as number | undefined,
  startDate: '',
  department: '',
  position: '',
  employeeType: '',
  contractDuration: undefined as number | undefined,
  skills: [] as string[],
  needEquipment: false,
  equipmentNote: '',
  bio: '',
  notes: '',
  agreeTerms: false,
})

// 部门选项 / Department options
const departments = [
  { value: 'engineering', label: '工程部 / Engineering' },
  { value: 'product', label: '产品部 / Product' },
  { value: 'design', label: '设计部 / Design' },
  { value: 'marketing', label: '市场部 / Marketing' },
  { value: 'hr', label: '人力资源部 / Human Resources' },
  { value: 'finance', label: '财务部 / Finance' },
]

// 岗位选项（根据部门联动）/ Position options (cascading from department)
const positionMap: Record<string, { value: string; label: string }[]> = {
  engineering: [
    { value: 'frontend', label: '前端开发 / Frontend Dev' },
    { value: 'backend', label: '后端开发 / Backend Dev' },
    { value: 'fullstack', label: '全栈开发 / Full-stack Dev' },
    { value: 'devops', label: 'DevOps 工程师 / DevOps Engineer' },
    { value: 'qa', label: '测试工程师 / QA Engineer' },
  ],
  product: [
    { value: 'pm', label: '产品经理 / Product Manager' },
    { value: 'po', label: '产品负责人 / Product Owner' },
  ],
  design: [
    { value: 'ui', label: 'UI 设计师 / UI Designer' },
    { value: 'ux', label: 'UX 设计师 / UX Designer' },
    { value: 'graphic', label: '平面设计师 / Graphic Designer' },
  ],
  marketing: [
    { value: 'content', label: '内容运营 / Content Marketing' },
    { value: 'growth', label: '增长运营 / Growth Marketing' },
    { value: 'brand', label: '品牌经理 / Brand Manager' },
  ],
  hr: [
    { value: 'recruiter', label: '招聘专员 / Recruiter' },
    { value: 'hrbp', label: 'HRBP' },
  ],
  finance: [
    { value: 'accountant', label: '会计 / Accountant' },
    { value: 'auditor', label: '审计 / Auditor' },
  ],
}

// 当前可选的岗位列表（联动）/ Available positions (cascading)
const availablePositions = computed(() => positionMap[form.department] || [])

// 技能选项 / Skill options
const skillOptions = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'vue', label: 'Vue.js' },
  { value: 'react', label: 'React' },
  { value: 'design', label: 'UI/UX Design' },
  { value: 'pm', label: 'Project Management' },
  { value: 'data', label: 'Data Analysis' },
]

// 是否显示合同期限字段（仅外包/兼职时显示联动）/ Show contract duration (only for contractor/parttime)
const showContractDuration = computed(() =>
  form.employeeType === 'contractor' || form.employeeType === 'parttime',
)

// 表单校验规则 / Form validation rules
const rules = reactive<FormRules>({
  fullName: [{ required: true, message: '请输入姓名 / Please enter name', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱 / Please enter email', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确 / Invalid email format', trigger: 'blur' },
  ],
  startDate: [{ required: true, message: '请选择入职日期 / Please select start date', trigger: 'change' }],
  department: [{ required: true, message: '请选择部门 / Please select department', trigger: 'change' }],
  position: [{ required: true, message: '请选择岗位 / Please select position', trigger: 'change' }],
  employeeType: [{ required: true, message: '请选择员工类型 / Please select employee type', trigger: 'change' }],
})

// 提交时的快照数据 / Snapshot of submitted data
const submittedData = ref<Record<string, unknown>>({})

/**
 * 部门变更时清空岗位（联动重置）/ Clear position when department changes (cascading reset)
 */
function onDepartmentChange() {
  form.position = ''
}

/**
 * 员工类型变更时清空合同期限 / Clear contract duration when employee type changes
 */
function onEmployeeTypeChange() {
  if (!showContractDuration.value) {
    form.contractDuration = undefined
  }
}

/**
 * 提交表单 / Submit form
 */
async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (!form.agreeTerms) {
    ElMessage.warning('请先同意协议 / Please agree to the terms first')
    return
  }

  // 快照提交数据 / Snapshot submitted data
  const deptItem = departments.find(d => d.value === form.department)
  const posItem = availablePositions.value.find(p => p.value === form.position)
  submittedData.value = {
    fullName: form.fullName,
    email: form.email,
    phone: form.phone || '—',
    age: form.age ?? '—',
    startDate: form.startDate,
    department: deptItem?.label || form.department,
    position: posItem?.label || form.position,
    employeeType: employeeTypeLabel(form.employeeType),
    contractDuration: showContractDuration.value ? `${form.contractDuration || '—'} 个月 / months` : '—',
    skills: form.skills.length ? form.skills.join(', ') : '—',
    needEquipment: form.needEquipment ? '是 / Yes' : '否 / No',
    equipmentNote: form.needEquipment && form.equipmentNote ? form.equipmentNote : '—',
    bio: form.bio || '—',
    notes: form.notes || '—',
    submittedAt: new Date().toLocaleString(),
  }

  pageState.value = 'summary'
  ElMessage.success('提交成功！/ Submitted successfully!')
}

/**
 * 获取员工类型显示标签 / Get employee type display label
 */
function employeeTypeLabel(val: string): string {
  const map: Record<string, string> = {
    fulltime: '全职 / Full-time',
    parttime: '兼职 / Part-time',
    intern: '实习 / Intern',
    contractor: '外包 / Contractor',
  }
  return map[val] || val
}

/**
 * 重置并返回表单 / Reset and go back to form
 */
function handleBackToForm() {
  // 重置表单数据 / Reset form data
  Object.assign(form, {
    fullName: '',
    email: '',
    phone: '',
    age: undefined,
    startDate: '',
    department: '',
    position: '',
    employeeType: '',
    contractDuration: undefined,
    skills: [],
    needEquipment: false,
    equipmentNote: '',
    bio: '',
    notes: '',
    agreeTerms: false,
  })
  pageState.value = 'form'
}
</script>

<template>
  <div class="demo-page">
    <!-- 顶部导航栏 / Top navigation bar -->
    <header class="demo-nav">
      <div class="demo-nav__inner">
        <div class="demo-nav__brand">
          <svg class="demo-nav__logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" /><path d="M20 14h2" />
            <path d="M15 13v2" /><path d="M9 13v2" />
          </svg>
          <span class="demo-nav__title">Paget Demo</span>
        </div>
        <nav class="demo-nav__links">
          <a href="/" class="demo-nav__link">Home</a>
          <a href="/demo" class="demo-nav__link demo-nav__link--active">Demo Form</a>
        </nav>
      </div>
    </header>

    <!-- 主体区域 / Main area -->
    <main class="demo-main">
      <div class="demo-form-container">
        <div class="demo-form__header">
          <h1 class="demo-form__title">新员工入职登记表</h1>
          <p class="demo-form__subtitle">Employee Onboarding Registration Form</p>
        </div>

        <!-- ==================== 表单模式 / Form mode ==================== -->
        <div v-if="pageState === 'form'" class="demo-form__body">
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-position="top"
            size="default"
          >
            <!-- 基本信息 / Basic Information -->
            <div class="demo-section">
              <div class="demo-section__title">基本信息 / Basic Information</div>

              <el-form-item label="姓名 / Full Name" prop="fullName">
                <el-input v-model="form.fullName" placeholder="请输入姓名 / Enter full name" />
              </el-form-item>

              <div class="demo-row">
                <el-form-item label="邮箱 / Email" prop="email" class="demo-row__item">
                  <el-input v-model="form.email" type="email" placeholder="name@company.com" />
                </el-form-item>
                <el-form-item label="电话 / Phone" prop="phone" class="demo-row__item">
                  <el-input v-model="form.phone" placeholder="138-xxxx-xxxx" />
                </el-form-item>
              </div>

              <div class="demo-row">
                <el-form-item label="年龄 / Age" prop="age" class="demo-row__item">
                  <el-input-number
                    v-model="form.age"
                    :min="18"
                    :max="65"
                    placeholder="25"
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
                <el-form-item label="入职日期 / Start Date" prop="startDate" class="demo-row__item">
                  <el-date-picker
                    v-model="form.startDate"
                    type="date"
                    placeholder="选择日期 / Select date"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </div>
            </div>

            <!-- 岗位信息（部门→岗位联动）/ Position Information (department→position cascading) -->
            <div class="demo-section">
              <div class="demo-section__title">岗位信息 / Position Information</div>

              <div class="demo-row">
                <el-form-item label="部门 / Department" prop="department" class="demo-row__item">
                  <el-select
                    v-model="form.department"
                    placeholder="请选择部门 / Select Department"
                    style="width: 100%"
                    @change="onDepartmentChange"
                  >
                    <el-option
                      v-for="dept in departments"
                      :key="dept.value"
                      :label="dept.label"
                      :value="dept.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="岗位 / Position" prop="position" class="demo-row__item">
                  <el-select
                    v-model="form.position"
                    placeholder="请先选择部门 / Select department first"
                    :disabled="!form.department"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="pos in availablePositions"
                      :key="pos.value"
                      :label="pos.label"
                      :value="pos.value"
                    />
                  </el-select>
                </el-form-item>
              </div>

              <el-form-item label="员工类型 / Employee Type" prop="employeeType">
                <el-radio-group v-model="form.employeeType" @change="onEmployeeTypeChange">
                  <el-radio value="fulltime">全职 / Full-time</el-radio>
                  <el-radio value="parttime">兼职 / Part-time</el-radio>
                  <el-radio value="intern">实习 / Intern</el-radio>
                  <el-radio value="contractor">外包 / Contractor</el-radio>
                </el-radio-group>
              </el-form-item>

              <!-- 联动：外包/兼职时显示合同期限 / Cascading: show contract duration for contractor/parttime -->
              <el-form-item
                v-if="showContractDuration"
                label="合同期限（月）/ Contract Duration (months)"
                prop="contractDuration"
              >
                <el-input-number
                  v-model="form.contractDuration"
                  :min="1"
                  :max="36"
                  placeholder="6"
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </div>

            <!-- 技能与其他 / Skills & Others -->
            <div class="demo-section">
              <div class="demo-section__title">技能与自我介绍 / Skills & Bio</div>

              <el-form-item label="技能标签 / Skills" prop="skills">
                <el-checkbox-group v-model="form.skills">
                  <el-checkbox
                    v-for="skill in skillOptions"
                    :key="skill.value"
                    :label="skill.label"
                    :value="skill.value"
                  />
                </el-checkbox-group>
              </el-form-item>

              <!-- 联动：是否需要设备 → 设备备注 / Cascading: need equipment → equipment note -->
              <el-form-item label="是否需要配备设备 / Need Equipment">
                <el-switch v-model="form.needEquipment" />
              </el-form-item>

              <el-form-item
                v-if="form.needEquipment"
                label="设备需求说明 / Equipment Requirements"
                prop="equipmentNote"
              >
                <el-input
                  v-model="form.equipmentNote"
                  type="textarea"
                  :rows="2"
                  placeholder="例如：MacBook Pro 16 寸 / e.g., MacBook Pro 16 inch"
                />
              </el-form-item>

              <el-form-item label="个人简介 / Personal Bio" prop="bio">
                <el-input
                  v-model="form.bio"
                  type="textarea"
                  :rows="3"
                  placeholder="请简要介绍自己 / Brief self-introduction"
                />
              </el-form-item>

              <el-form-item label="备注 / Notes" prop="notes">
                <el-input
                  v-model="form.notes"
                  type="textarea"
                  :rows="2"
                  placeholder="其他需要说明的事项 / Additional notes"
                />
              </el-form-item>
            </div>

            <!-- 协议与提交 / Agreement & Submit -->
            <div class="demo-form__footer">
              <el-form-item prop="agreeTerms">
                <el-checkbox v-model="form.agreeTerms">
                  我已阅读并同意《员工手册》及相关规定 / I have read and agree to the Employee Handbook
                </el-checkbox>
              </el-form-item>

              <div class="demo-form__actions">
                <el-button type="primary" size="large" :disabled="!form.agreeTerms" @click="handleSubmit">
                  提交 / Submit
                </el-button>
                <el-button size="large" @click="formRef?.resetFields()">
                  重置 / Reset
                </el-button>
              </div>
            </div>
          </el-form>
        </div>

        <!-- ==================== 提交成功汇总 / Submission Summary ==================== -->
        <div v-else class="demo-summary">
          <div class="demo-summary__badge">
            <span class="demo-summary__badge-icon">&#10003;</span>
            提交成功！信息已入库 / Submitted! Data saved to database
          </div>

          <el-descriptions
            title="提交信息汇总 / Submission Summary"
            :column="2"
            border
            size="default"
          >
            <el-descriptions-item label="姓名 / Name">{{ submittedData.fullName }}</el-descriptions-item>
            <el-descriptions-item label="邮箱 / Email">{{ submittedData.email }}</el-descriptions-item>
            <el-descriptions-item label="电话 / Phone">{{ submittedData.phone }}</el-descriptions-item>
            <el-descriptions-item label="年龄 / Age">{{ submittedData.age }}</el-descriptions-item>
            <el-descriptions-item label="入职日期 / Start Date">{{ submittedData.startDate }}</el-descriptions-item>
            <el-descriptions-item label="部门 / Department">{{ submittedData.department }}</el-descriptions-item>
            <el-descriptions-item label="岗位 / Position">{{ submittedData.position }}</el-descriptions-item>
            <el-descriptions-item label="员工类型 / Type">{{ submittedData.employeeType }}</el-descriptions-item>
            <el-descriptions-item label="合同期限 / Contract">{{ submittedData.contractDuration }}</el-descriptions-item>
            <el-descriptions-item label="技能 / Skills" :span="2">{{ submittedData.skills }}</el-descriptions-item>
            <el-descriptions-item label="需要设备 / Equipment">{{ submittedData.needEquipment }}</el-descriptions-item>
            <el-descriptions-item label="设备说明 / Equipment Note">{{ submittedData.equipmentNote }}</el-descriptions-item>
            <el-descriptions-item label="个人简介 / Bio" :span="2">{{ submittedData.bio }}</el-descriptions-item>
            <el-descriptions-item label="备注 / Notes" :span="2">{{ submittedData.notes }}</el-descriptions-item>
            <el-descriptions-item label="提交时间 / Submitted At" :span="2">{{ submittedData.submittedAt }}</el-descriptions-item>
          </el-descriptions>

          <div class="demo-summary__actions">
            <el-button type="primary" size="large" @click="handleBackToForm">
              返回重新填写 / Back to Form
            </el-button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.demo-page {
  min-height: 100vh;
  background: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 导航栏 / Navigation bar */
.demo-nav {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.demo-nav__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.demo-nav__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.demo-nav__logo {
  width: 28px;
  height: 28px;
  color: #4285f4;
}

.demo-nav__title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.demo-nav__links {
  display: flex;
  gap: 24px;
}

.demo-nav__link {
  font-size: 14px;
  color: #6b7280;
  text-decoration: none;
  padding: 4px 0;
  border-bottom: 2px solid transparent;
  transition: color 0.2s, border-color 0.2s;
}

.demo-nav__link:hover {
  color: #4285f4;
}

.demo-nav__link--active {
  color: #4285f4;
  border-bottom-color: #4285f4;
}

/* 主体区域 / Main area */
.demo-main {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}

.demo-form-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.demo-form__header {
  padding: 32px 32px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.demo-form__title {
  font-size: 22px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 4px;
}

.demo-form__subtitle {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

/* 表单主体 / Form body */
.demo-form__body {
  padding: 24px 32px 32px;
}

/* 分段 / Sections */
.demo-section {
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f5f5f5;
}

.demo-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.demo-section__title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
}

/* 双列行 / Two-column row */
.demo-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.demo-row__item {
  margin-bottom: 0;
}

/* 底部 / Footer */
.demo-form__footer {
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.demo-form__actions {
  display: flex;
  gap: 12px;
}

/* ===== 提交汇总页 / Summary page ===== */
.demo-summary {
  padding: 32px;
}

.demo-summary__badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  margin-bottom: 24px;
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
}

.demo-summary__badge-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #059669;
  color: #fff;
  font-size: 14px;
  flex-shrink: 0;
}

.demo-summary__actions {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}
</style>
