from ollama_client import get_focus_advice


def main():

    result = get_focus_advice(
        kategori="Matematik",
        sure=25,
        calisma_degerlendirmesi="Zordu"
    )

    print(result)


if __name__ == "__main__":
    main()