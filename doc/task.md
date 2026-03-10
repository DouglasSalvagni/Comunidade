# Módulo de Conteúdo (Cursos) - Task Tracker

## Phase 1: Planning
- [x] Explore codebase structure (backend + frontend)
- [x] Understand existing patterns (entities, controllers, services, API, UI)
- [x] Write implementation plan
- [x] Get user approval

## Phase 2: Backend — Entities & Migration
- [x] Create [Course](file:///c:/Users/Douglas/Desktop/wizer/MVPs/comunidade/backend/src/modules/courses/entities/course.entity.ts#15-51) entity
- [x] Create [CourseModule](file:///c:/Users/Douglas/Desktop/wizer/MVPs/comunidade/backend/src/modules/courses/entities/course-module.entity.ts#14-41) entity
- [x] Create [Lesson](file:///c:/Users/Douglas/Desktop/wizer/MVPs/comunidade/backend/src/modules/courses/entities/lesson.entity.ts#12-48) entity
- [x] Create [LessonProgress](file:///c:/Users/Douglas/Desktop/wizer/MVPs/comunidade/backend/src/modules/courses/entities/lesson-progress.entity.ts#13-42) entity
- [x] Create [CoursePlanAccess](file:///c:/Users/Douglas/Desktop/wizer/MVPs/comunidade/backend/src/modules/courses/entities/course-plan-access.entity.ts#12-32) entity
- [x] Create migration [CreateCoursesTables1775000000000](file:///c:/Users/Douglas/Desktop/wizer/MVPs/comunidade/backend/src/database/migrations/1775000000000-create-courses-tables.ts#3-187)
- [x] Register entities in [datasource.ts](file:///c:/Users/Douglas/Desktop/wizer/MVPs/comunidade/backend/src/database/datasource.ts)

## Phase 3: Backend — DTOs, Service, Controllers
- [x] Create DTOs (`create-course`, `update-course`, `create-module`, `create-lesson`, `update-progress`)
- [x] Create [CoursesService](file:///c:/Users/Douglas/Desktop/wizer/MVPs/comunidade/backend/src/modules/courses/courses.service.ts#22-439) (admin + user methods)
- [x] Create [StorageService](file:///c:/Users/Douglas/Desktop/wizer/MVPs/comunidade/backend/src/modules/courses/storage.service.ts#6-91) (S3 pre-signed URLs)
- [x] Create [AdminCoursesController](file:///c:/Users/Douglas/Desktop/wizer/MVPs/comunidade/backend/src/modules/courses/admin-courses.controller.ts#24-186) (full CRUD + upload + plan access)
- [x] Create [CoursesController](file:///c:/Users/Douglas/Desktop/wizer/MVPs/comunidade/backend/src/modules/courses/courses.controller.ts#15-53) (user: list, detail, lesson, progress)
- [x] Create [CoursesModule](file:///c:/Users/Douglas/Desktop/wizer/MVPs/comunidade/backend/src/modules/courses/courses.module.ts#15-32) and register in [AppModule](file:///c:/Users/Douglas/Desktop/wizer/MVPs/comunidade/backend/src/app.module.ts#21-86)
- [x] Install `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`
- [x] Add S3 env vars to [.env](file:///c:/Users/Douglas/Desktop/wizer/MVPs/comunidade/backend/.env) and [.env.example](file:///c:/Users/Douglas/Desktop/wizer/MVPs/comunidade/backend/.env.example)
- [x] ✅ Backend build passes

## Phase 4: Frontend — API Service & Interfaces
- [x] Add course TypeScript interfaces to [api.ts](file:///c:/Users/Douglas/Desktop/wizer/MVPs/comunidade/frontend/src/services/api.ts)
- [x] Add admin course API methods
- [x] Add user course API methods
- [x] Install `hls.js`

## Phase 5: Frontend — Navigation
- [x] Add "Cursos" to admin sidebar ([layout.tsx](file:///c:/Users/Douglas/Desktop/wizer/MVPs/comunidade/frontend/src/app/layout.tsx))
- [x] Add "Cursos" to user dashboard sidebar ([Sidebar.tsx](file:///c:/Users/Douglas/Desktop/wizer/MVPs/comunidade/frontend/src/components/Sidebar.tsx))

## Phase 6: Frontend — Admin Pages
- [x] Create admin courses list page (`/admin/courses`)
- [x] Create admin course detail/edit page (`/admin/courses/[id]`)

## Phase 7: Frontend — Dashboard (User) Pages
- [x] Create courses list page (`/dashboard/courses`)
- [x] Create course detail page (`/dashboard/courses/[id]`)
- [x] Create lesson viewer page (`/dashboard/courses/lessons/[lessonId]`)
  - [x] HLS.js video player with auto-resume
  - [x] Auto progress save (15s interval)
  - [x] Lesson navigation (prev/next)
  - [x] Mark as complete on video end

## Phase 8: Pending
- [ ] Run migration on database
- [ ] End-to-end testing
- [ ] Frontend build verification
