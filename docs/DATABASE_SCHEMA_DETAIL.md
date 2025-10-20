# 데이터베이스 스키마 상세 정보

**생성일시**: 2025. 10. 20. 오후 5:04:44

---

## SequelizeMeta

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `name` | character varying(255) | NO | - |

### 인덱스

- **SequelizeMeta_pkey**
  ```sql
  CREATE UNIQUE INDEX "SequelizeMeta_pkey" ON public."SequelizeMeta" USING btree (name)
  ```

**현재 레코드 수**: 6개

---

## approval_approvers

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('approval_approvers_id_seq'::regclass) |
| `code` | character varying(50) | NO | - |
| `name` | character varying(255) | NO | - |
| `title` | character varying(255) | NO | - |
| `department` | character varying(255) | NO | - |
| `description` | text | NO | - |
| `basis` | text | YES | - |
| `is_active` | boolean | YES | true |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### 인덱스

- **approval_approvers_code_key**
  ```sql
  CREATE UNIQUE INDEX approval_approvers_code_key ON public.approval_approvers USING btree (code)
  ```
- **approval_approvers_pkey**
  ```sql
  CREATE UNIQUE INDEX approval_approvers_pkey ON public.approval_approvers USING btree (id)
  ```

**현재 레코드 수**: 4개

---

## approval_conditions

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('approval_conditions_id_seq'::regclass) |
| `approver_id` | integer(32) | NO | - |
| `condition_type` | character varying(50) | NO | - |
| `condition_value` | character varying(255) | NO | - |
| `condition_label` | character varying(255) | NO | - |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### 인덱스

- **approval_conditions_pkey**
  ```sql
  CREATE UNIQUE INDEX approval_conditions_pkey ON public.approval_conditions USING btree (id)
  ```

### 외래키

- **approval_conditions_approver_id_fkey**: `approver_id` → `approval_approvers.id`

**현재 레코드 수**: 4개

---

## approval_lines

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('approval_lines_id_seq'::regclass) |
| `proposal_id` | integer(32) | NO | - |
| `step` | integer(32) | NO | - |
| `name` | character varying(255) | NO | - |
| `title` | character varying(255) | NO | - |
| `description` | text | NO | - |
| `is_conditional` | boolean | YES | false |
| `is_final` | boolean | YES | false |
| `status` | character varying(50) | YES | 'pending'::character varying |
| `approved_at` | timestamp with time zone | YES | - |
| `approved_by` | character varying(255) | YES | - |
| `comment` | text | YES | - |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### 인덱스

- **approval_lines_pkey**
  ```sql
  CREATE UNIQUE INDEX approval_lines_pkey ON public.approval_lines USING btree (id)
  ```

### 외래키

- **approval_lines_proposal_id_fkey**: `proposal_id` → `proposals.id`

**현재 레코드 수**: 0개

---

## approval_references

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('approval_references_id_seq'::regclass) |
| `amount_range` | character varying(255) | NO | - |
| `min_amount` | numeric(15,2) | YES | - |
| `max_amount` | numeric(15,2) | YES | - |
| `included_approvers` | text | NO | - |
| `final_approver` | character varying(255) | NO | - |
| `description` | text | YES | - |
| `is_active` | boolean | YES | true |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### 인덱스

- **approval_references_pkey**
  ```sql
  CREATE UNIQUE INDEX approval_references_pkey ON public.approval_references USING btree (id)
  ```

**현재 레코드 수**: 4개

---

## approval_rules

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('approval_rules_id_seq'::regclass) |
| `rule_type` | character varying(50) | NO | - |
| `rule_name` | character varying(255) | NO | - |
| `rule_content` | text | NO | - |
| `basis` | text | YES | - |
| `is_active` | boolean | YES | true |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### 인덱스

- **approval_rules_pkey**
  ```sql
  CREATE UNIQUE INDEX approval_rules_pkey ON public.approval_rules USING btree (id)
  ```

**현재 레코드 수**: 3개

---

## budgets

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('budgets_id_seq'::regclass) |
| `name` | character varying(255) | NO | - |
| `year` | integer(32) | NO | - |
| `type` | character varying(20) | YES | 'general'::character varying |
| `total_amount` | numeric(15,2) | NO | - |
| `used_amount` | numeric(15,2) | YES | 0 |
| `remaining_amount` | numeric(15,2) | YES | - |
| `department` | character varying(255) | YES | - |
| `description` | text | YES | - |
| `is_active` | boolean | YES | true |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### 인덱스

- **budgets_pkey**
  ```sql
  CREATE UNIQUE INDEX budgets_pkey ON public.budgets USING btree (id)
  ```

**현재 레코드 수**: 3개

---

## business_budget_approvals

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('business_budget_approvals_id_seq'::regclass) |
| `budget_id` | integer(32) | YES | - |
| `approver_name` | character varying(100) | NO | - |
| `approver_title` | character varying(100) | NO | - |
| `approval_status` | character varying(20) | NO | - |
| `approval_comment` | text | YES | - |
| `approved_at` | timestamp without time zone | YES | CURRENT_TIMESTAMP |

### 인덱스

- **business_budget_approvals_pkey**
  ```sql
  CREATE UNIQUE INDEX business_budget_approvals_pkey ON public.business_budget_approvals USING btree (id)
  ```

### 외래키

- **business_budget_approvals_budget_id_fkey**: `budget_id` → `business_budgets.id`

**현재 레코드 수**: 0개

---

## business_budget_details

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('business_budget_details_id_seq'::regclass) |
| `budget_id` | integer(32) | YES | - |
| `item_name` | character varying(255) | NO | - |
| `item_description` | text | YES | - |
| `unit_price` | numeric(15,2) | NO | - |
| `quantity` | integer(32) | NO | - |
| `total_amount` | numeric(15,2) | NO | - |
| `executed_amount` | numeric(15,2) | YES | 0 |
| `created_at` | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp without time zone | YES | CURRENT_TIMESTAMP |

### 인덱스

- **business_budget_details_pkey**
  ```sql
  CREATE UNIQUE INDEX business_budget_details_pkey ON public.business_budget_details USING btree (id)
  ```

### 외래키

- **business_budget_details_budget_id_fkey**: `budget_id` → `business_budgets.id`

**현재 레코드 수**: 0개

---

## business_budget_history

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('business_budget_history_id_seq'::regclass) |
| `budget_id` | integer(32) | NO | - |
| `change_type` | character varying(20) | NO | - |
| `changed_field` | character varying(100) | YES | - |
| `old_value` | text | YES | - |
| `new_value` | text | YES | - |
| `changed_at` | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| `changed_by` | character varying(100) | YES | - |
| `created_at` | timestamp without time zone | YES | CURRENT_TIMESTAMP |

### 인덱스

- **business_budget_history_pkey**
  ```sql
  CREATE UNIQUE INDEX business_budget_history_pkey ON public.business_budget_history USING btree (id)
  ```

### 외래키

- **business_budget_history_budget_id_fkey**: `budget_id` → `business_budgets.id`

**현재 레코드 수**: 2개

---

## business_budgets

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('business_budgets_id_seq'::regclass) |
| `project_name` | character varying(255) | NO | - |
| `initiator_department` | character varying(100) | NO | - |
| `executor_department` | character varying(100) | NO | - |
| `budget_type` | character varying(50) | NO | - |
| `budget_category` | character varying(100) | NO | - |
| `budget_amount` | numeric(15,2) | NO | - |
| `executed_amount` | numeric(15,2) | YES | 0 |
| `start_date` | character varying(7) | NO | - |
| `end_date` | character varying(7) | NO | - |
| `is_essential` | boolean | YES | false |
| `project_purpose` | character varying(10) | NO | - |
| `budget_year` | integer(32) | NO | - |
| `status` | character varying(20) | YES | '승인대기'::character varying |
| `created_by` | character varying(100) | YES | '작성자'::character varying |
| `created_at` | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| `pending_amount` | numeric(15,2) | YES | 0 |
| `confirmed_execution_amount` | numeric(15,2) | YES | 0 |
| `unexecuted_amount` | numeric(15,2) | YES | 0 |
| `additional_budget` | numeric(15,2) | YES | 0 |
| `hold_cancel_reason` | text | YES | - |
| `notes` | text | YES | - |
| `it_plan_reported` | boolean | YES | false |

### 인덱스

- **business_budgets_pkey**
  ```sql
  CREATE UNIQUE INDEX business_budgets_pkey ON public.business_budgets USING btree (id)
  ```

**현재 레코드 수**: 11개

---

## contract_methods

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('contract_methods_id_seq'::regclass) |
| `code` | character varying(50) | NO | - |
| `name` | character varying(255) | NO | - |
| `value` | character varying(255) | YES | - |
| `description` | text | YES | - |
| `basis` | text | YES | - |
| `is_active` | boolean | YES | true |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### 인덱스

- **contract_methods_code_key**
  ```sql
  CREATE UNIQUE INDEX contract_methods_code_key ON public.contract_methods USING btree (code)
  ```
- **contract_methods_pkey**
  ```sql
  CREATE UNIQUE INDEX contract_methods_pkey ON public.contract_methods USING btree (id)
  ```

**현재 레코드 수**: 21개

---

## contracts

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('contracts_id_seq'::regclass) |
| `proposal_id` | integer(32) | NO | - |
| `contract_number` | character varying(255) | NO | - |
| `contract_type` | character varying(50) | NO | - |
| `supplier_id` | integer(32) | YES | - |
| `contract_amount` | numeric(15,2) | NO | - |
| `start_date` | date | NO | - |
| `end_date` | date | NO | - |
| `payment_method` | character varying(50) | YES | - |
| `status` | character varying(50) | YES | 'draft'::character varying |
| `description` | text | YES | - |
| `attachments` | json | YES | - |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### 인덱스

- **contracts_contract_number_key**
  ```sql
  CREATE UNIQUE INDEX contracts_contract_number_key ON public.contracts USING btree (contract_number)
  ```
- **contracts_pkey**
  ```sql
  CREATE UNIQUE INDEX contracts_pkey ON public.contracts USING btree (id)
  ```

### 외래키

- **contracts_proposal_id_fkey**: `proposal_id` → `proposals.id`
- **contracts_supplier_id_fkey**: `supplier_id` → `suppliers.id`

**현재 레코드 수**: 0개

---

## cost_departments

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('cost_departments_id_seq'::regclass) |
| `proposal_id` | integer(32) | NO | - |
| `department_id` | integer(32) | YES | - |
| `department` | character varying(255) | NO | - |
| `amount` | numeric(15,2) | NO | - |
| `ratio` | numeric(5,2) | YES | 0 |
| `purchase_item_id` | integer(32) | YES | - |
| `allocation_type` | character varying(50) | YES | - |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |
| `service_item_id` | integer(32) | YES | - |

### 인덱스

- **cost_departments_pkey**
  ```sql
  CREATE UNIQUE INDEX cost_departments_pkey ON public.cost_departments USING btree (id)
  ```

### 외래키

- **cost_departments_proposal_id_fkey**: `proposal_id` → `proposals.id`
- **cost_departments_department_id_fkey**: `department_id` → `departments.id`
- **cost_departments_purchase_item_id_fkey**: `purchase_item_id` → `purchase_items.id`
- **cost_departments_service_item_id_fkey**: `service_item_id` → `service_items.id`

**현재 레코드 수**: 198개

---

## departments

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('departments_id_seq'::regclass) |
| `name` | character varying(255) | NO | - |
| `code` | character varying(50) | YES | - |
| `parent_id` | integer(32) | YES | - |
| `manager` | character varying(255) | YES | - |
| `description` | text | YES | - |
| `is_active` | boolean | YES | true |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### 인덱스

- **departments_code_key**
  ```sql
  CREATE UNIQUE INDEX departments_code_key ON public.departments USING btree (code)
  ```
- **departments_name_key**
  ```sql
  CREATE UNIQUE INDEX departments_name_key ON public.departments USING btree (name)
  ```
- **departments_pkey**
  ```sql
  CREATE UNIQUE INDEX departments_pkey ON public.departments USING btree (id)
  ```

### 외래키

- **departments_parent_id_fkey**: `parent_id` → `departments.id`

**현재 레코드 수**: 6개

---

## document_templates

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('document_templates_id_seq'::regclass) |
| `name` | character varying(200) | NO | - |
| `description` | text | YES | - |
| `content` | text | NO | - |
| `category` | character varying(50) | YES | 'general'::character varying |
| `is_active` | boolean | YES | true |
| `display_order` | integer(32) | YES | 0 |
| `created_by` | character varying(100) | YES | - |
| `created_at` | timestamp with time zone | NO | - |
| `updated_at` | timestamp with time zone | NO | - |

### 인덱스

- **document_templates_pkey**
  ```sql
  CREATE UNIQUE INDEX document_templates_pkey ON public.document_templates USING btree (id)
  ```

**현재 레코드 수**: 4개

---

## project_purposes

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('project_purposes_id_seq'::regclass) |
| `code` | character varying(10) | NO | - |
| `description` | text | NO | - |
| `year` | integer(32) | NO | - |
| `created_at` | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| `is_fixed` | boolean | YES | false |

### 인덱스

- **idx_project_purposes_code**
  ```sql
  CREATE INDEX idx_project_purposes_code ON public.project_purposes USING btree (code)
  ```
- **idx_project_purposes_year**
  ```sql
  CREATE INDEX idx_project_purposes_year ON public.project_purposes USING btree (year)
  ```
- **project_purposes_code_year_key**
  ```sql
  CREATE UNIQUE INDEX project_purposes_code_year_key ON public.project_purposes USING btree (code, year)
  ```
- **project_purposes_pkey**
  ```sql
  CREATE UNIQUE INDEX project_purposes_pkey ON public.project_purposes USING btree (id)
  ```

**현재 레코드 수**: 34개

---

## proposal_histories

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('proposal_histories_id_seq'::regclass) |
| `proposal_id` | integer(32) | NO | - |
| `changed_by` | character varying(255) | NO | - |
| `changed_at` | timestamp with time zone | YES | now() |
| `change_type` | character varying(50) | NO | - |
| `field_name` | character varying(255) | YES | - |
| `old_value` | text | YES | - |
| `new_value` | text | YES | - |
| `description` | text | YES | - |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### 인덱스

- **proposal_histories_pkey**
  ```sql
  CREATE UNIQUE INDEX proposal_histories_pkey ON public.proposal_histories USING btree (id)
  ```

### 외래키

- **proposal_histories_proposal_id_fkey**: `proposal_id` → `proposals.id`

**현재 레코드 수**: 28개

---

## proposals

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('proposals_id_seq'::regclass) |
| `contract_type` | character varying(50) | NO | - |
| `title` | character varying(500) | YES | - |
| `purpose` | text | NO | - |
| `basis` | text | NO | - |
| `budget_id` | integer(32) | YES | - |
| `contract_method` | character varying(50) | YES | - |
| `contract_method_id` | integer(32) | YES | - |
| `account_subject` | character varying(255) | YES | - |
| `total_amount` | numeric(15,2) | YES | 0 |
| `change_reason` | text | YES | - |
| `extension_reason` | text | YES | - |
| `contract_period` | character varying(255) | YES | - |
| `contract_start_date` | date | YES | - |
| `contract_end_date` | date | YES | - |
| `payment_method` | character varying(50) | YES | - |
| `status` | character varying(50) | YES | 'draft'::character varying |
| `created_by` | character varying(255) | YES | - |
| `proposal_date` | date | YES | - |
| `approval_date` | date | YES | - |
| `is_draft` | boolean | YES | false |
| `wysiwyg_content` | text | YES | - |
| `other` | text | YES | - |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### 인덱스

- **idx_proposals_budget_status**
  ```sql
  CREATE INDEX idx_proposals_budget_status ON public.proposals USING btree (budget_id, status)
  ```
- **proposals_pkey**
  ```sql
  CREATE UNIQUE INDEX proposals_pkey ON public.proposals USING btree (id)
  ```

**현재 레코드 수**: 135개

---

## purchase_history

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('purchase_history_id_seq'::regclass) |
| `proposal_id` | integer(32) | YES | - |
| `supplier_id` | integer(32) | YES | - |
| `purchase_date` | date | YES | - |
| `purchase_amount` | numeric(15,2) | YES | 0 |
| `notes` | text | YES | - |
| `created_at` | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp without time zone | YES | CURRENT_TIMESTAMP |

### 인덱스

- **purchase_history_pkey**
  ```sql
  CREATE UNIQUE INDEX purchase_history_pkey ON public.purchase_history USING btree (id)
  ```

**현재 레코드 수**: 0개

---

## purchase_item_cost_allocations

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('purchase_item_cost_allocations_id_seq'::regclass) |
| `purchase_item_id` | integer(32) | NO | - |
| `department_id` | integer(32) | YES | - |
| `department` | character varying(255) | NO | - |
| `amount` | numeric(15,2) | NO | - |
| `ratio` | numeric(5,2) | YES | 0 |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### 인덱스

- **purchase_item_cost_allocations_pkey**
  ```sql
  CREATE UNIQUE INDEX purchase_item_cost_allocations_pkey ON public.purchase_item_cost_allocations USING btree (id)
  ```

### 외래키

- **purchase_item_cost_allocations_purchase_item_id_fkey**: `purchase_item_id` → `purchase_items.id`
- **purchase_item_cost_allocations_department_id_fkey**: `department_id` → `departments.id`

**현재 레코드 수**: 0개

---

## purchase_items

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('purchase_items_id_seq'::regclass) |
| `proposal_id` | integer(32) | NO | - |
| `supplier_id` | integer(32) | YES | - |
| `item` | character varying(255) | NO | - |
| `product_name` | character varying(255) | NO | - |
| `quantity` | integer(32) | NO | - |
| `unit_price` | numeric(15,2) | NO | - |
| `amount` | numeric(15,2) | NO | - |
| `supplier` | character varying(255) | NO | - |
| `request_department` | character varying(255) | YES | - |
| `contract_period_type` | character varying(50) | YES | 'permanent'::character varying |
| `custom_contract_period` | text | YES | - |
| `contract_start_date` | date | YES | - |
| `contract_end_date` | date | YES | - |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### 인덱스

- **purchase_items_pkey**
  ```sql
  CREATE UNIQUE INDEX purchase_items_pkey ON public.purchase_items USING btree (id)
  ```

### 외래키

- **purchase_items_proposal_id_fkey**: `proposal_id` → `proposals.id`
- **purchase_items_supplier_id_fkey**: `supplier_id` → `suppliers.id`

**현재 레코드 수**: 94개

---

## request_departments

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('request_departments_id_seq'::regclass) |
| `proposal_id` | integer(32) | NO | - |
| `department_id` | integer(32) | YES | - |
| `department` | character varying(255) | NO | - |
| `name` | character varying(255) | YES | - |
| `code` | character varying(255) | YES | - |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### 인덱스

- **request_departments_pkey**
  ```sql
  CREATE UNIQUE INDEX request_departments_pkey ON public.request_departments USING btree (id)
  ```

### 외래키

- **request_departments_proposal_id_fkey**: `proposal_id` → `proposals.id`
- **request_departments_department_id_fkey**: `department_id` → `departments.id`

**현재 레코드 수**: 208개

---

## service_items

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('service_items_id_seq'::regclass) |
| `proposal_id` | integer(32) | NO | - |
| `supplier_id` | integer(32) | YES | - |
| `item` | character varying(255) | NO | - |
| `name` | character varying(255) | YES | - |
| `personnel` | integer(32) | NO | 1 |
| `skill_level` | character varying(50) | YES | - |
| `period` | numeric(10,2) | NO | 1 |
| `monthly_rate` | numeric(15,2) | NO | - |
| `contract_amount` | numeric(15,2) | NO | - |
| `supplier` | character varying(255) | NO | - |
| `credit_rating` | character varying(255) | YES | - |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |
| `contract_period_start` | timestamp with time zone | YES | - |
| `contract_period_end` | timestamp with time zone | YES | - |
| `payment_method` | character varying(255) | YES | - |

### 인덱스

- **service_items_pkey**
  ```sql
  CREATE UNIQUE INDEX service_items_pkey ON public.service_items USING btree (id)
  ```

### 외래키

- **service_items_proposal_id_fkey**: `proposal_id` → `proposals.id`
- **service_items_supplier_id_fkey**: `supplier_id` → `suppliers.id`

**현재 레코드 수**: 61개

---

## suppliers

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('suppliers_id_seq'::regclass) |
| `name` | character varying(255) | NO | - |
| `business_number` | character varying(50) | YES | - |
| `representative` | character varying(255) | YES | - |
| `address` | text | YES | - |
| `phone` | character varying(50) | YES | - |
| `email` | character varying(255) | YES | - |
| `credit_rating` | character varying(10) | YES | - |
| `business_type` | character varying(255) | YES | - |
| `registration_date` | date | YES | - |
| `is_active` | boolean | YES | true |
| `notes` | text | YES | - |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### 인덱스

- **suppliers_business_number_key**
  ```sql
  CREATE UNIQUE INDEX suppliers_business_number_key ON public.suppliers USING btree (business_number)
  ```
- **suppliers_pkey**
  ```sql
  CREATE UNIQUE INDEX suppliers_pkey ON public.suppliers USING btree (id)
  ```

**현재 레코드 수**: 3개

---

## tasks

### 컬럼 정보

| 컬럼명 | 데이터 타입 | Null | 기본값 |
|--------|------------|------|--------|
| `id` | integer(32) | NO | nextval('tasks_id_seq'::regclass) |
| `task_name` | character varying(200) | NO | - |
| `description` | text | YES | - |
| `shared_folder_path` | character varying(500) | YES | - |
| `start_date` | date | YES | - |
| `end_date` | date | YES | - |
| `status` | character varying(20) | NO | 'active'::character varying |
| `assigned_department` | character varying(100) | YES | - |
| `assigned_person` | character varying(100) | YES | - |
| `priority` | character varying(10) | NO | 'medium'::character varying |
| `is_active` | boolean | YES | true |
| `created_at` | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| `updated_at` | timestamp without time zone | NO | CURRENT_TIMESTAMP |

### 인덱스

- **tasks_pkey**
  ```sql
  CREATE UNIQUE INDEX tasks_pkey ON public.tasks USING btree (id)
  ```

**현재 레코드 수**: 7개

---

