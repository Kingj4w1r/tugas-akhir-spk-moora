"""
Flask backend untuk SPK MOORA — Penulis Terbaik LTC Indonesia
"""

from flask import Flask, render_template, request, jsonify
import numpy as np
import pandas as pd
import json

app = Flask(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Default data
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_KRITERIA = [
    {"kode": "C1", "nama": "Jumlah Karya Dipentaskan",         "sifat": "benefit", "bobot": 4},
    {"kode": "C2", "nama": "Jumlah Penghargaan",               "sifat": "benefit", "bobot": 2},
    {"kode": "C3", "nama": "Jumlah Karya Diproduksi",          "sifat": "benefit", "bobot": 2},
    {"kode": "C4", "nama": "Durasi Penyelesaian Naskah (bln)", "sifat": "cost",    "bobot": 1},
    {"kode": "C5", "nama": "Anggaran Produksi (Jt Rp)",        "sifat": "cost",    "bobot": 1},
]

DEFAULT_ALTERNATIF = [
    {"nama": "Holifah Wira",    "C1": 2, "C2": 0, "C3": 3, "C4": 8,  "C5": 65},
    {"nama": "Ari Sumitro",     "C1": 2, "C2": 1, "C3": 5, "C4": 6,  "C5": 75},
    {"nama": "Sarah Nurmala",   "C1": 2, "C2": 2, "C3": 2, "C4": 10, "C5": 82},
    {"nama": "Bambang Prihadi", "C1": 3, "C2": 4, "C3": 6, "C4": 12, "C5": 155},
]


# ─────────────────────────────────────────────────────────────────────────────
# MOORA engine
# ─────────────────────────────────────────────────────────────────────────────

def hitung_moora(kriteria: list, alternatif: list) -> dict:
    kode_list = [k["kode"] for k in kriteria]
    nama_list = [a["nama"] for a in alternatif]

    # Step 1 — Matriks Keputusan
    data = [[a[k] for k in kode_list] for a in alternatif]
    df_x = pd.DataFrame(data, index=nama_list, columns=kode_list, dtype=float)

    # Step 2 — Normalisasi
    penyebut = np.sqrt((df_x ** 2).sum())
    df_norm  = df_x / penyebut

    # Step 3 — Terbobot
    bobot = pd.Series({k["kode"]: k["bobot"] for k in kriteria}, dtype=float)
    df_tw = df_norm * bobot

    # Step 4 — Yi
    benefit_cols = [k["kode"] for k in kriteria if k["sifat"] == "benefit"]
    cost_cols    = [k["kode"] for k in kriteria if k["sifat"] == "cost"]

    sum_benefit = df_tw[benefit_cols].sum(axis=1)
    sum_cost    = df_tw[cost_cols].sum(axis=1)
    yi          = sum_benefit - sum_cost

    # Step 5 — Ranking
    ranking_df = yi.sort_values(ascending=False).reset_index()
    ranking_df.columns = ["nama", "yi"]
    ranking_df["rank"] = range(1, len(ranking_df) + 1)

    def df_to_records(df):
        return json.loads(df.round(6).to_json(orient="split"))

    return {
        "kriteria": kriteria,
        "step1": df_to_records(df_x),
        "step2": {
            "penyebut": {k: round(float(v), 6) for k, v in penyebut.items()},
            "matrix": df_to_records(df_norm),
        },
        "step3": df_to_records(df_tw),
        "step4": {
            "benefit_cols": benefit_cols,
            "cost_cols": cost_cols,
            "sum_benefit": {k: round(float(v), 6) for k, v in sum_benefit.items()},
            "sum_cost":    {k: round(float(v), 6) for k, v in sum_cost.items()},
            "yi":          {k: round(float(v), 6) for k, v in yi.items()},
        },
        "step5": ranking_df.to_dict(orient="records"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template(
        "index.html",
        default_kriteria=json.dumps(DEFAULT_KRITERIA),
        default_alternatif=json.dumps(DEFAULT_ALTERNATIF),
    )


@app.route("/hitung", methods=["POST"])
def hitung():
    body = request.get_json()
    try:
        hasil = hitung_moora(body["kriteria"], body["alternatif"])
        return jsonify({"ok": True, "data": hasil})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True, port=5000)
