import json
import os


def save_as_js(data, var_name, repo, prefix, output_dir="src/data/"):
    os.makedirs(output_dir, exist_ok=True)
    filename = os.path.join(output_dir, f"{prefix}_{repo}.js")

    with open(filename, "w", encoding="utf-8") as f:
        f.write(f"const {var_name} = ")
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write(f";\n\nexport default {var_name};\n")

    print(f"✅ JS salvo em: {filename}")
    return filename
