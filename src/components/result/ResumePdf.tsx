import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ExportableResume } from "@/lib/resume-export";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 42,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: "#1e293b",
    lineHeight: 1.4,
  },
  name: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    color: "#0f172a",
  },
  title: {
    fontSize: 10.5,
    textAlign: "center",
    color: "#475569",
    marginTop: 2,
  },
  contact: {
    fontSize: 8.5,
    textAlign: "center",
    color: "#64748b",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 2,
    marginTop: 12,
    marginBottom: 5,
  },
  summary: {
    fontSize: 9.5,
    color: "#334155",
  },
  itemBlock: {
    marginBottom: 6,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    flex: 1,
    paddingRight: 8,
  },
  itemLink: {
    fontSize: 8.5,
    color: "#64748b",
  },
  meta: {
    fontSize: 8.5,
    color: "#64748b",
  },
  description: {
    fontSize: 9,
    color: "#475569",
    fontStyle: "italic",
    marginTop: 1,
  },
  technologies: {
    fontSize: 8.5,
    color: "#475569",
    marginTop: 1,
    marginBottom: 1,
  },
  bulletRow: {
    flexDirection: "row",
    marginTop: 1,
  },
  bulletMark: {
    width: 9,
    fontSize: 9.5,
    color: "#334155",
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    color: "#334155",
  },
  skillRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  skillCategory: {
    width: 120,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
  },
  skillItems: {
    flex: 1,
    fontSize: 9,
    color: "#334155",
  },
  educationLine: {
    fontSize: 9.5,
    color: "#334155",
  },
  educationMeta: {
    fontSize: 8.5,
    color: "#64748b",
    marginBottom: 3,
  },
  twoColumns: {
    flexDirection: "row",
  },
  columnLeft: {
    width: "60%",
    paddingRight: 16,
  },
  columnRight: {
    width: "40%",
  },
});

interface ResumePdfProps {
  data: ExportableResume;
}

export function ResumePdf({ data }: ResumePdfProps) {
  return (
    <Document
      title={`Currículo — ${data.nome}`}
      author={data.nome}
      subject={data.titulo}
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{data.nome}</Text>
        {data.titulo ? <Text style={styles.title}>{data.titulo}</Text> : null}
        {data.contatoLinha ? (
          <Text style={styles.contact}>{data.contatoLinha}</Text>
        ) : null}

        {data.resumo ? (
          <View>
            <Text style={styles.sectionTitle}>Resumo</Text>
            <Text style={styles.summary}>{data.resumo}</Text>
          </View>
        ) : null}

        {data.experiencias.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Experiência Profissional</Text>
            {data.experiencias.map((experience, index) => (
              <View
                key={`${experience.empresa}-${index}`}
                style={styles.itemBlock}
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.itemTitle}>
                    {experience.cargo} — {experience.empresa}
                  </Text>
                  {experience.periodo ? (
                    <Text style={styles.meta}>{experience.periodo}</Text>
                  ) : null}
                </View>
                {experience.local ? (
                  <Text style={styles.meta}>{experience.local}</Text>
                ) : null}
                {experience.bullets.map((bullet, bulletIndex) => (
                  <View
                    key={`${experience.empresa}-bullet-${bulletIndex}`}
                    style={styles.bulletRow}
                  >
                    <Text style={styles.bulletMark}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {data.projetos.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Projetos</Text>
            {data.projetos.map((project, index) => (
              <View key={`${project.nome}-${index}`} style={styles.itemBlock}>
                <View style={styles.rowBetween}>
                  <Text style={styles.itemTitle}>{project.nome}</Text>
                  {project.link ? (
                    <Text style={styles.itemLink}>{project.link}</Text>
                  ) : null}
                </View>
                {project.descricao ? (
                  <Text style={styles.description}>{project.descricao}</Text>
                ) : null}
                {project.tecnologias.length > 0 ? (
                  <Text style={styles.technologies}>
                    {project.tecnologias.join(" · ")}
                  </Text>
                ) : null}
                {project.bullets.map((bullet, bulletIndex) => (
                  <View
                    key={`${project.nome}-bullet-${bulletIndex}`}
                    style={styles.bulletRow}
                  >
                    <Text style={styles.bulletMark}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {data.skills.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Habilidades</Text>
            {data.skills.map((group) => (
              <View key={group.categoria} style={styles.skillRow}>
                <Text style={styles.skillCategory}>{group.categoria}</Text>
                <Text style={styles.skillItems}>
                  {group.itens.join(", ")}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {data.educacao.length > 0 || data.idiomas.length > 0 ? (
          <View style={styles.twoColumns}>
            {data.educacao.length > 0 ? (
              <View style={styles.columnLeft}>
                <Text style={styles.sectionTitle}>Formação</Text>
                {data.educacao.map((item, index) => (
                  <View key={`${item.curso}-${index}`}>
                    <Text style={styles.educationLine}>
                      {item.curso} — {item.instituicao}
                    </Text>
                    {item.periodo || item.status ? (
                      <Text style={styles.educationMeta}>
                        {[item.periodo, item.status].filter(Boolean).join(" · ")}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.columnLeft} />
            )}

            {data.idiomas.length > 0 ? (
              <View style={styles.columnRight}>
                <Text style={styles.sectionTitle}>Idiomas</Text>
                {data.idiomas.map((item, index) => (
                  <Text
                    key={`${item.idioma}-${index}`}
                    style={styles.educationLine}
                  >
                    {item.idioma}
                    {item.nivel ? ` — ${item.nivel}` : ""}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {data.certificacoes.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Certificações</Text>
            {data.certificacoes.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.bulletRow}>
                <Text style={styles.bulletMark}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
