# ArthSaathi Knowledge Base

Four domain-separated FAISS vector stores. Each directory maps to one dedicated FAISS index.
**Do NOT merge these stores** — each agent queries only its relevant domain.

---

## Directory Structure

```
knowledge_base/
├── financial_literacy/          → FAISS Store 1 (Financial Analysis + Coach Agent)
│   ├── 01_emergency_fund.md
│   ├── 02_budgeting.md
│   ├── 03_savings_instruments.md
│   ├── 04_mutual_funds_sip.md
│   ├── 05_insurance.md
│   └── 06_debt_management.md
│
├── rbi_regulatory/              → FAISS Store 2 (Risk Assessment + Explainability Agent)
│   ├── 01_consumer_protection.md
│   ├── 02_digital_payments.md
│   ├── 03_loan_regulations.md
│   ├── 04_kyc_regulations.md
│   └── 05_nbfc_microfinance.md
│
├── government_schemes/          → FAISS Store 3 (Government Scheme Matching Agent)
│   ├── 01_pmjdy.md
│   ├── 02_pmmy_mudra.md
│   ├── 03_apy.md
│   ├── 04_pmsby_pmjjby.md
│   ├── 05_pmay.md
│   └── 06_nps_kisan_svanidhi.md
│
└── scam_patterns/               → FAISS Store 4 (Scam Detection Agent)
    ├── 01_common_scams.md
    ├── 02_social_engineering.md
    ├── 03_investment_scams.md
    └── 04_gig_rural_scams.md
```

---

## Store 1 — Financial Literacy

| File | Topics Covered |
|------|---------------|
| `01_emergency_fund.md` | What is an emergency fund, how much to save, where to keep it (liquid MFs, sweep FD), building from zero |
| `02_budgeting.md` | 50-30-20 rule adapted for India, gig worker zero-based budgeting, budgeting tools |
| `03_savings_instruments.md` | PPF, RD, FD, NSC, Sukanya Samriddhi Yojana — rates, lock-ins, tax treatment |
| `04_mutual_funds_sip.md` | Mutual fund types, SIP mechanics, rupee cost averaging, 2024 tax rules, expense ratios |
| `05_insurance.md` | Term life (how much, CSR), health insurance, PMJAY eligibility, insurance fraud |
| `06_debt_management.md` | Good vs bad debt, DTI ratio, credit card trap, avalanche/snowball strategies, CIBIL score |

**Embedding model:** `paraphrase-multilingual-MiniLM-L12-v2`
**Languages covered:** English (primary), Hindi/Marathi/Kannada queries will retrieve via semantic similarity

---

## Store 2 — RBI Regulatory

| File | Topics Covered |
|------|---------------|
| `01_consumer_protection.md` | RBI Ombudsman, unauthorized transaction liability, Fair Practices Code |
| `02_digital_payments.md` | UPI limits/refund rules, NEFT/RTGS/IMPS regulations, Positive Pay, failed transaction rights |
| `03_loan_regulations.md` | KFS mandate, prepayment rights, APR disclosure, credit score/CIBIL, recovery agent rules |
| `04_kyc_regulations.md` | OVD list, e-KYC, periodic KYC update rights, V-CIP, MF KYC |
| `05_nbfc_microfinance.md` | NBFC registration check, MFI 2022 framework, digital lending rules, P2P regulation |

---

## Store 3 — Government Schemes

| File | Scheme(s) | Key Eligibility |
|------|-----------|----------------|
| `01_pmjdy.md` | PM Jan Dhan Yojana | Any Indian 10+ years; zero balance account |
| `02_pmmy_mudra.md` | MUDRA Loans (Shishu/Kishore/Tarun) | Non-farm micro enterprises; gig/self-employed |
| `03_apy.md` | Atal Pension Yojana | 18–40 years; not income tax payer; bank account required |
| `04_pmsby_pmjjby.md` | PMSBY (accident ₹2L) + PMJJBY (life ₹2L) | 18–70 (PMSBY) / 18–50 (PMJJBY); bank account |
| `05_pmay.md` | PM Awas Yojana (urban + rural) | First-time home buyer; income-based categories |
| `06_nps_kisan_svanidhi.md` | NPS, PM Kisan, SVANidhi, Stand Up India, PM Vishwakarma | Varies by scheme |

---

## Store 4 — Scam Patterns

| File | Scam Types Covered |
|------|-------------------|
| `01_common_scams.md` | Lottery, fake KYC, fake loan apps, Ponzi, job scams, OTP/UPI fraud |
| `02_social_engineering.md` | Authority impersonation, urgency tactics, digital arrest scam (2024), reciprocity trap |
| `03_investment_scams.md` | Pump-and-dump, fake mutual fund apps, crypto/NFT scams, fake PMS, chit fund fraud |
| `04_gig_rural_scams.md` | Fake delivery jobs, fake DBT, fake KCC agents, property fraud, loan waiver scams |

---

## RAG Ingestion Notes

### Chunking Strategy
- Chunk size: 500–700 tokens
- Overlap: 50–100 tokens
- Split on markdown headings (##, ###) to preserve semantic coherence

### Embedding Model
```python
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
```

### FAISS Index Type
`IndexFlatL2` for hackathon (exact search, no approximation, predictable behavior)
For production: `IndexIVFFlat` with nlist=100

### Document Metadata to Store per Chunk
```python
{
    "source_file": "government_schemes/03_apy.md",
    "store": "government_schemes",
    "chunk_index": 2,
    "heading": "Pension Tiers"
}
```
