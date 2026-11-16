--
-- PostgreSQL database dump
--

\restrict WKCyLoX8q8Mj8sFZAUAE3uFqrsg4HjYJAWa1anwTh3bndvmXm8cyi2RLfEzdGZP

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.applications (
    application_id bigint NOT NULL,
    student_id bigint NOT NULL,
    internship_id bigint NOT NULL,
    status character varying(20) DEFAULT 'submitted'::character varying NOT NULL,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT applications_status_check CHECK (((status)::text = ANY ((ARRAY['submitted'::character varying, 'under_review'::character varying, 'shortlisted'::character varying, 'rejected'::character varying, 'accepted'::character varying, 'withdrawn'::character varying])::text[])))
);


--
-- Name: applications_application_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.applications ALTER COLUMN application_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.applications_application_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: internship_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.internship_skills (
    internship_id bigint NOT NULL,
    skill_id bigint NOT NULL,
    is_mandatory boolean DEFAULT true NOT NULL
);


--
-- Name: internships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.internships (
    internship_id bigint NOT NULL,
    posted_by bigint NOT NULL,
    title character varying(180) NOT NULL,
    company_name character varying(180) NOT NULL,
    description text NOT NULL,
    location character varying(150),
    work_mode character varying(20) DEFAULT 'onsite'::character varying NOT NULL,
    internship_type character varying(30) DEFAULT 'unpaid'::character varying NOT NULL,
    stipend numeric(10,2),
    eligibility_criteria text,
    deadline date,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT internships_internship_type_check CHECK (((internship_type)::text = ANY ((ARRAY['paid'::character varying, 'unpaid'::character varying, 'stipend'::character varying])::text[]))),
    CONSTRAINT internships_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'open'::character varying, 'closed'::character varying])::text[]))),
    CONSTRAINT internships_stipend_check CHECK (((stipend IS NULL) OR (stipend >= (0)::numeric))),
    CONSTRAINT internships_work_mode_check CHECK (((work_mode)::text = ANY ((ARRAY['onsite'::character varying, 'remote'::character varying, 'hybrid'::character varying])::text[])))
);


--
-- Name: internships_internship_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.internships ALTER COLUMN internship_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.internships_internship_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    project_id bigint NOT NULL,
    user_id bigint NOT NULL,
    project_title character varying(180) NOT NULL,
    description text NOT NULL,
    project_url text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: projects_project_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.projects ALTER COLUMN project_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.projects_project_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: saved_internships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_internships (
    student_id bigint NOT NULL,
    internship_id bigint NOT NULL,
    saved_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skills (
    skill_id bigint NOT NULL,
    skill_name character varying(100) NOT NULL,
    category character varying(80)
);


--
-- Name: skills_skill_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.skills ALTER COLUMN skill_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.skills_skill_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: student_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_profiles (
    user_id bigint NOT NULL,
    full_name character varying(120) NOT NULL,
    education character varying(150),
    graduation_year integer,
    career_goals text,
    profile_text text,
    CONSTRAINT student_profiles_graduation_year_check CHECK (((graduation_year >= 2000) AND (graduation_year <= 2100)))
);


--
-- Name: student_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_skills (
    user_id bigint NOT NULL,
    skill_id bigint NOT NULL,
    proficiency integer,
    CONSTRAINT student_skills_proficiency_check CHECK (((proficiency >= 1) AND (proficiency <= 5)))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id bigint NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['student'::character varying, 'admin'::character varying])::text[])))
);


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.users ALTER COLUMN user_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (application_id);


--
-- Name: applications applications_student_id_internship_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_student_id_internship_id_key UNIQUE (student_id, internship_id);


--
-- Name: internship_skills internship_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.internship_skills
    ADD CONSTRAINT internship_skills_pkey PRIMARY KEY (internship_id, skill_id);


--
-- Name: internships internships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.internships
    ADD CONSTRAINT internships_pkey PRIMARY KEY (internship_id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (project_id);


--
-- Name: saved_internships saved_internships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_internships
    ADD CONSTRAINT saved_internships_pkey PRIMARY KEY (student_id, internship_id);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (skill_id);


--
-- Name: skills skills_skill_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_skill_name_key UNIQUE (skill_name);


--
-- Name: student_profiles student_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: student_skills student_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_skills
    ADD CONSTRAINT student_skills_pkey PRIMARY KEY (user_id, skill_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: idx_applications_internship_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_applications_internship_status ON public.applications USING btree (internship_id, status);


--
-- Name: idx_internship_skills_skill; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_internship_skills_skill ON public.internship_skills USING btree (skill_id);


--
-- Name: idx_internships_status_deadline; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_internships_status_deadline ON public.internships USING btree (status, deadline);


--
-- Name: idx_projects_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_user ON public.projects USING btree (user_id);


--
-- Name: idx_student_skills_skill; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_skills_skill ON public.student_skills USING btree (skill_id);


--
-- Name: applications applications_internship_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_internship_id_fkey FOREIGN KEY (internship_id) REFERENCES public.internships(internship_id);


--
-- Name: applications applications_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student_profiles(user_id);


--
-- Name: internship_skills internship_skills_internship_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.internship_skills
    ADD CONSTRAINT internship_skills_internship_id_fkey FOREIGN KEY (internship_id) REFERENCES public.internships(internship_id) ON DELETE CASCADE;


--
-- Name: internship_skills internship_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.internship_skills
    ADD CONSTRAINT internship_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(skill_id) ON DELETE CASCADE;


--
-- Name: internships internships_posted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.internships
    ADD CONSTRAINT internships_posted_by_fkey FOREIGN KEY (posted_by) REFERENCES public.users(user_id);


--
-- Name: projects projects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.student_profiles(user_id) ON DELETE CASCADE;


--
-- Name: saved_internships saved_internships_internship_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_internships
    ADD CONSTRAINT saved_internships_internship_id_fkey FOREIGN KEY (internship_id) REFERENCES public.internships(internship_id) ON DELETE CASCADE;


--
-- Name: saved_internships saved_internships_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_internships
    ADD CONSTRAINT saved_internships_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student_profiles(user_id) ON DELETE CASCADE;


--
-- Name: student_profiles student_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: student_skills student_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_skills
    ADD CONSTRAINT student_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(skill_id) ON DELETE CASCADE;


--
-- Name: student_skills student_skills_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_skills
    ADD CONSTRAINT student_skills_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.student_profiles(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict WKCyLoX8q8Mj8sFZAUAE3uFqrsg4HjYJAWa1anwTh3bndvmXm8cyi2RLfEzdGZP

