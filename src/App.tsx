import { useEffect, useMemo, useState } from "react"
import "./App.css"
import { getTasks, getGroups, getUsers, getStages } from "./api/tasksApi"
import Select from "react-select"
import "react-datepicker/dist/react-datepicker.css"
import DatePicker from "react-datepicker"

type Task = {
  title: string
  created_date: string
  deadline: string
  closed_date: string | null
  stage: string | null
  group: string | null
  creator: string | null
  executor: string | null
}

type Group = { id: number; title: string }
type User = { id: number; full_name: string }
type Stage = { title: string }

type Filters = {
  group_id: string
  executor_id: string
  stage_title: string
  created_from: string
  created_to: string
}

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const stageBadgeClass = (stage?: string | null) => {
  if (!stage) return "text-bg-secondary"
  const s = stage.toLowerCase()
  if (s.includes("готово")) return "text-bg-success"
  if (s.includes("ошибка")) return "text-bg-danger"
  if (s.includes("тест")) return "text-bg-warning"
  if (s.includes("разработ")) return "text-bg-primary"
  if (s.includes("очеред")) return "text-bg-info"
  return "text-bg-secondary"
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stages, setStages] = useState<Stage[]>([])

  const [filters, setFilters] = useState<Filters>({
    group_id: "",
    executor_id: "",
    stage_title: "",
    created_from: "",
    created_to: "",
  })

  const executorOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: u.full_name,
      })),
    [users]
  )

  const setField = (name: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const buildParams = (f: Filters) => {
    return {
      ...(f.group_id ? { group_id: Number(f.group_id) } : {}),
      ...(f.executor_id ? { executor_id: Number(f.executor_id) } : {}),
      ...(f.stage_title ? { stage_title: f.stage_title } : {}),
      ...(f.created_from ? { created_from: `${f.created_from}T00:00:00` } : {}),
      ...(f.created_to ? { created_to: `${f.created_to}T23:59:59` } : {}),
    }
  }

  const loadTasks = async (customFilters?: Filters) => {
    const f = customFilters ?? filters
    try {
      setLoading(true)
      setError(null)
      const data = await getTasks(buildParams(f))
      setTasks(data as Task[])
    } catch (e) {
      setError("API ulanib bo‘lmadi")
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const loadOptions = async () => {
    try {
      const [g, u, s] = await Promise.all([getGroups(), getUsers(), getStages()])

      // stages unique (title bo‘yicha)
      const map = new Map<string, Stage>()
      ;(s as Stage[]).forEach((st) => {
        if (st?.title && !map.has(st.title)) map.set(st.title, st)
      })
      const uniqueStages = Array.from(map.values())

      setGroups(g as Group[])
      setUsers(u as User[])
      setStages(uniqueStages)
    } catch (e) {
      console.error("Options load error:", e)
    }
  }

  useEffect(() => {
    loadTasks()
    loadOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="container-fluid p-0">
      <div className="page-wrap">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 className="m-0 page-title"></h2>
          <div className="text-muted small">{loading ? "Loading..." : `Count: ${tasks.length}`}</div>
        </div>

        {/* Filters */}
        <div className="card border-0 shadow-sm mb-3 w-100">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              {/* Group */}
              <div className="col-12 col-md-3 col-lg-2">
                <label className="form-label">Группа</label>
                <select
                  className="form-select"
                  value={filters.group_id}
                  onChange={(e) => setField("group_id", e.target.value)}
                >
                  <option value="">Все</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Executor */}
              <div className="col-12 col-md-5 col-lg-3">
                <label className="form-label">Исполнитель</label>
                <Select
                  options={executorOptions}
                  isClearable
                  placeholder="Search executor..."
                  value={executorOptions.find((o) => String(o.value) === filters.executor_id) || null}
                  onChange={(opt) => setField("executor_id", opt ? String(opt.value) : "")}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  styles={{
                    container: (base) => ({ ...base, width: "100%" }),
                    control: (base) => ({ ...base, minHeight: "38px" }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    menu: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
              </div>

              {/* Stage */}
              <div className="col-12 col-md-4 col-lg-2">
                <label className="form-label">Статус</label>
                <select
                  className="form-select"
                  value={filters.stage_title}
                  onChange={(e) => setField("stage_title", e.target.value)}
                >
                  <option value="">Все</option>
                  {stages.map((s, idx) => (
                    <option key={`${s.title}-${idx}`} value={s.title}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Created from */}
              <div className="col-12 col-sm-6 col-lg-2">
                <label className="form-label">Создано с</label>
                <DatePicker
                  selected={filters.created_from ? new Date(filters.created_from) : null}
                  onChange={(date: Date | null) =>
                    setField("created_from", date ? date.toISOString().slice(0, 10) : "")
                  }
                  dateFormat="dd.MM.yyyy"
                  placeholderText="дд.мм.гггг"
                  className="form-control"
                  isClearable
                  showPopperArrow={false}
                  popperPlacement="bottom-start"
                  portalId="root-portal"
                  popperClassName="datepicker-popper"
                />
              </div>

              {/* Created to */}
              <div className="col-12 col-sm-6 col-lg-2">
                <label className="form-label">Создано до</label>
                <DatePicker
                  selected={filters.created_to ? new Date(filters.created_to) : null}
                  onChange={(date: Date | null) =>
                    setField("created_to", date ? date.toISOString().slice(0, 10) : "")
                  }
                  dateFormat="dd.MM.yyyy"
                  placeholderText="дд.мм.гггг"
                  className="form-control"
                  isClearable
                  showPopperArrow={false}
                  popperPlacement="bottom-start"
                  portalId="root-portal"
                  popperClassName="datepicker-popper"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="d-flex flex-wrap justify-content-start gap-2 mt-3">
              <button className="btn btn-primary px-4" onClick={() => loadTasks()}>
                Применить
              </button>

              <button
                className="btn btn-outline-secondary px-4"
                onClick={() => {
                  const cleared: Filters = {
                    group_id: "",
                    executor_id: "",
                    stage_title: "",
                    created_from: "",
                    created_to: "",
                  }
                  setFilters(cleared)
                  loadTasks(cleared)
                }}
              >
                Очистить
              </button>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {/* ✅ Desktop table */}
        <div className="card border-0 shadow-sm table-card w-100 d-none d-lg-block">
          <div className="table-scroll">
            <table className="table table-hover align-middle mb-0 tasks-table">
              <thead className="table-light">
                <tr>
                  <th className="sticky-col" style={{ minWidth: 320 }}>
                    Название
                  </th>
                  <th style={{ minWidth: 170 }}>Создано</th>
                  <th style={{ minWidth: 170 }}>Срок</th>
                  <th style={{ minWidth: 170 }}>Закрыто</th>
                  <th style={{ minWidth: 160 }}>Статус</th>
                  <th style={{ minWidth: 200 }}>Группа</th>
                  <th style={{ minWidth: 240 }}>Создатель</th>
                  <th style={{ minWidth: 220 }}>Исполнитель</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      Загрузка...
                    </td>
                  </tr>
                )}

                {!loading &&
                  tasks.map((t, i) => (
                    <tr key={i}>
                      <td className="sticky-col">
                        <div className="truncate fw-semibold" title={t.title}>
                          {t.title}
                        </div>
                      </td>

                      <td title={t.created_date}>{formatDateTime(t.created_date)}</td>
                      <td title={t.deadline}>{formatDateTime(t.deadline)}</td>
                      <td title={t.closed_date ?? ""}>{formatDateTime(t.closed_date)}</td>

                      <td title={t.stage ?? ""}>
                        <span className={`badge ${stageBadgeClass(t.stage)}`}>{t.stage ?? "—"}</span>
                      </td>

                      <td title={t.group ?? ""}>
                        <div className="truncate" style={{ maxWidth: 220 }}>
                          {t.group ?? "—"}
                        </div>
                      </td>

                      <td title={t.creator ?? ""}>
                        <div className="truncate" style={{ maxWidth: 260 }}>
                          {t.creator ?? "—"}
                        </div>
                      </td>

                      <td title={t.executor ?? ""}>
                        <div className="truncate" style={{ maxWidth: 220 }}>
                          {t.executor ?? "—"}
                        </div>
                      </td>
                    </tr>
                  ))}

                {!loading && tasks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      Нет задач
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ✅ Mobile cards */}
        <div className="d-block d-lg-none">
          {loading && <div className="card border-0 shadow-sm p-3 text-center">Загрузка...</div>}

          {!loading && tasks.length === 0 && (
            <div className="card border-0 shadow-sm p-3 text-center text-muted">Нет задач</div>
          )}

          {!loading &&
            tasks.map((t, i) => (
              <div key={i} className="card border-0 shadow-sm task-card mb-3">
                <div className="card-body">
                  {/* Title + Stage badge */}
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div className="fw-semibold task-title">{t.title}</div>
                    <span className={`badge ${stageBadgeClass(t.stage)}`}>
                      {t.stage ?? "—"}
                    </span>
                  </div>

                  <div className="task-meta mt-2">
                    <div className="row g-2">

                      {/* 1. Название */}
                      <div className="col-12">
                        <div className="meta-item">
                          <span className="meta-label">Название:</span>
                          <span className="meta-value">{t.title}</span>
                        </div>
                      </div>

                      {/* 2. Создано */}
                      <div className="col-6">
                        <div className="meta-item">
                          <span className="meta-label">Создано:</span>
                          <span className="meta-value">{formatDateTime(t.created_date)}</span>
                        </div>
                      </div>

                      {/* 3. Статус (deadline) */}
                      <div className="col-6">
                        <div className="meta-item">
                          <span className="meta-label">Срок:</span>
                          <span className="meta-value">{formatDateTime(t.deadline)}</span>
                        </div>
                      </div>

                      {/* 4. Закрыто */}
                      <div className="col-12">
                        <div className="meta-item">
                          <span className="meta-label">Закрыто:</span>
                          <span className="meta-value">{formatDateTime(t.closed_date)}</span>
                        </div>
                      </div>

                      {/* 5. Stage */}
                      <div className="col-12">
                        <div className="meta-item">
                          <span className="meta-label">Статус:</span>
                          <span className="meta-value">{t.stage ?? "—"}</span>
                        </div>
                      </div>

                      {/* 6. Этап (Group) */}
                      <div className="col-12">
                        <div className="meta-item">
                          <span className="meta-label">Группа:</span>
                          <span className="meta-value">{t.group ?? "—"}</span>
                        </div>
                      </div>

                      {/* 7. Создатель */}
                      <div className="col-12">
                        <div className="meta-item">
                          <span className="meta-label">Создатель:</span>
                          <span className="meta-value">{t.creator ?? "—"}</span>
                        </div>
                      </div>

                      {/* 8. Исполнитель */}
                      <div className="col-12">
                        <div className="meta-item">
                          <span className="meta-label">Исполнитель:</span>
                          <span className="meta-value">{t.executor ?? "—"}</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div className="py-2" />
      </div>
    </div>
  )
}
