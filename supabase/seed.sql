-- =============================================
-- Date seed pentru mediul DEV al SOP Assistant
--
-- Acest script creeaza date de test pentru dezvoltare locala.
-- Ruleaza DOAR pe proiectul Supabase DEV!
--
-- Utilizare: lipeste in Supabase SQL Editor (proiectul dev)
-- sau ruleaza: supabase db execute --project-ref obdiggtvvchlnyecchgm < supabase/seed.sql
--
-- NOTA: Utilizatorii auth trebuie creati prin fluxul de signup.
-- Acest script populeaza tabelele publice presupunand ca utilizatorii exista deja.
-- Pentru un DB dev nou, creeaza mai intai utilizatori de test prin app,
-- apoi ruleaza acest script pentru a adauga organizatii, SOP-uri si asignari.
-- =============================================

-- =============================================
-- Helper: Creeaza o organizatie de test
-- =============================================
-- Dupa inregistrarea ca admin@test.com prin app, ruleaza:
--
-- SELECT create_organization('Organizatie Test', 'org-test');

-- =============================================
-- SOP-uri de exemplu (in limba romana)
-- =============================================

DO $$
DECLARE
  v_org_id UUID;
  v_admin_id UUID;
  v_process_id UUID;
BEGIN
  -- Ia prima organizatie (presupune ca exista cel putin una)
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'Nicio organizatie gasita. Creeaza una prin app, apoi reruleaza acest script.';
    RETURN;
  END IF;

  -- Ia utilizatorul admin
  SELECT om.user_id INTO v_admin_id
  FROM org_members om
  WHERE om.org_id = v_org_id AND om.role = 'admin'
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'Niciun admin gasit pentru organizatie.';
    RETURN;
  END IF;

  -- SOP 1: Verificare Siguranta Echipamente
  INSERT INTO processes (id, org_id, created_by, title, description, sop_text)
  VALUES (
    uuid_generate_v4(), v_org_id, v_admin_id,
    'Verificare Siguranta Echipamente',
    'Procedura zilnica de inspectie a sigurantei pentru echipamente de productie',
    E'## Procedura de Verificare a Sigurantei Echipamentelor\n\nAceasta procedura trebuie urmata zilnic inainte de inceperea activitatii de productie. Scopul este de a asigura ca toate echipamentele functioneaza in parametri normali si ca toate masurile de siguranta sunt active.\n\n### Pasi de urmat:\n\n1. **Deconectare alimentare** — Verifica ca alimentarea cu energie este deconectata inainte de inspectie\n2. **Aparatori de siguranta** — Controleaza ca toate aparatorile de protectie sunt la locul lor si fixate corect\n3. **Cabluri electrice** — Inspecteaza toate cablurile electrice pentru deteriorari, uzura sau conexiuni slabite\n4. **Butoane de urgenta** — Testeaza fiecare buton de oprire de urgenta pentru a confirma functionarea\n5. **Etichete de avertizare** — Verifica ca toate etichetele de avertizare sunt vizibile si lizibile\n6. **Stingatoare** — Controleaza accesibilitatea stingatoarelor de incendiu si data expirarii\n7. **Documentare** — Noteaza orice problema identificata in registrul de inspectie\n8. **Semnatura** — Semneaza registrul de inspectie confirmand finalizarea verificarii'
  )
  RETURNING id INTO v_process_id;

  INSERT INTO checklist_steps (process_id, step_number, step_text) VALUES
    (v_process_id, 1, 'Verifica ca alimentarea cu energie este deconectata inainte de inspectie'),
    (v_process_id, 2, 'Controleaza ca toate aparatorile de protectie sunt la locul lor'),
    (v_process_id, 3, 'Inspecteaza cablurile electrice pentru deteriorari sau uzura'),
    (v_process_id, 4, 'Testeaza fiecare buton de oprire de urgenta'),
    (v_process_id, 5, 'Verifica ca etichetele de avertizare sunt vizibile si lizibile'),
    (v_process_id, 6, 'Controleaza accesibilitatea stingatoarelor de incendiu'),
    (v_process_id, 7, 'Documenteaza orice problema identificata in registrul de inspectie'),
    (v_process_id, 8, 'Semneaza registrul de inspectie confirmand finalizarea verificarii');

  -- SOP 2: Onboarding Angajat Nou
  INSERT INTO processes (id, org_id, created_by, title, description, sop_text)
  VALUES (
    uuid_generate_v4(), v_org_id, v_admin_id,
    'Onboarding Angajat Nou',
    'Procedura standard pentru integrarea noilor membri ai echipei',
    E'## Procedura de Onboarding pentru Angajati Noi\n\nAceasta procedura asigura o integrare consistenta si eficienta a noilor angajati. Trebuie initiata cu cel putin 2 zile inainte de data de start.\n\n### Pasi de urmat:\n\n1. **Email de bun venit** — Trimite un email cu instructiunile pentru prima zi, inclusiv ora de sosire, locatia si persoana de contact\n2. **Pregatire statie de lucru** — Asigura-te ca biroul, calculatorul si materialele sunt pregatite cu credentialele de acces\n3. **Sedinta de orientare** — Programeaza intalnirea de orientare cu HR si managerul direct\n4. **Mentor desemnat** — Asigneaza un coleg mentor care va ghida noul angajat in prima luna\n5. **Politici si regulament** — Parcurge regulamentul intern, politicile companiei si procedurile de siguranta\n6. **Configurare IT** — Finalizeaza configurarea emailului, VPN-ului, accesului la tool-uri si sistemele interne\n7. **Prezentare echipa** — Faciliteaza intalnirea cu toti membrii echipei si departamentele relevante\n8. **Obiective 30-60-90 zile** — Stabileste obiectivele de performanta pentru primele 3 luni'
  )
  RETURNING id INTO v_process_id;

  INSERT INTO checklist_steps (process_id, step_number, step_text) VALUES
    (v_process_id, 1, 'Trimite emailul de bun venit cu instructiunile pentru prima zi'),
    (v_process_id, 2, 'Pregateste statia de lucru si credentialele de acces'),
    (v_process_id, 3, 'Programeaza sedinta de orientare cu HR si managerul direct'),
    (v_process_id, 4, 'Desemneaza un coleg mentor pentru noul angajat'),
    (v_process_id, 5, 'Parcurge regulamentul intern si politicile companiei'),
    (v_process_id, 6, 'Finalizeaza configurarea IT (email, VPN, tool-uri)'),
    (v_process_id, 7, 'Faciliteaza prezentarea cu membrii echipei'),
    (v_process_id, 8, 'Stabileste obiectivele de performanta pentru 30-60-90 zile');

  -- SOP 3: Procedura Raspuns la Incidente
  INSERT INTO processes (id, org_id, created_by, title, description, sop_text)
  VALUES (
    uuid_generate_v4(), v_org_id, v_admin_id,
    'Procedura Raspuns la Incidente',
    'Pasii de urmat cand apare un incident de productie',
    E'## Procedura de Raspuns la Incidente de Productie\n\nAceasta procedura trebuie urmata imediat la detectarea unui incident. Timpul de raspuns este critic — fiecare minut conteaza.\n\n### Pasi de urmat:\n\n1. **Confirma alerta** — Confirma primirea alertei de incident in maxim 5 minute de la notificare\n2. **Evalueaza severitatea** — Clasifica incidentul pe scala P1-P4 (P1 = critic, afecteaza toti utilizatorii)\n3. **Notifica liderul de garda** — Contacteaza liderul de echipa de garda prin canalul de urgenta\n4. **Incepe jurnalul** — Deschide un document de jurnal al incidentului cu timeline-ul evenimentelor\n5. **Identifica cauza** — Investigheaza si identifica cauza principala a incidentului\n6. **Implementeaza solutia** — Aplica fix-ul sau workaround-ul pentru restabilirea serviciului\n7. **Verifica rezolvarea** — Confirma ca incidentul este rezolvat si serviciul functioneaza normal\n8. **Raport post-mortem** — Scrie raportul post-mortem cu lectiile invatate si actiunile preventive'
  )
  RETURNING id INTO v_process_id;

  INSERT INTO checklist_steps (process_id, step_number, step_text) VALUES
    (v_process_id, 1, 'Confirma primirea alertei de incident in maxim 5 minute'),
    (v_process_id, 2, 'Evalueaza si clasifica severitatea incidentului (P1-P4)'),
    (v_process_id, 3, 'Notifica liderul de echipa de garda prin canalul de urgenta'),
    (v_process_id, 4, 'Deschide jurnalul incidentului cu timeline-ul evenimentelor'),
    (v_process_id, 5, 'Investigheaza si identifica cauza principala'),
    (v_process_id, 6, 'Implementeaza fix-ul sau workaround-ul necesar'),
    (v_process_id, 7, 'Verifica ca incidentul este rezolvat si serviciul functioneaza'),
    (v_process_id, 8, 'Scrie raportul post-mortem cu lectii invatate si actiuni preventive');

  RAISE NOTICE 'S-au adaugat 3 SOP-uri pentru organizatia %', v_org_id;
END $$;
