package com.bow.backend.model;

import jakarta.persistence.*;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Entity
@Table(name = "projects")
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private int taskCount;

    // ownership / visibility
    private String owner; // username
    private boolean teamProject;
    private String codeName;
    private String customer;
    private String orp;
    private String zniLink;
    private String curatorStatus;
    private String graphName;
    private String graphTransferMode = "Не передавать";
    private String graphInfoDate;
    @Column(nullable = true)
    private Boolean graphDone = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "project_curators", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "username", nullable = false)
    private Set<String> curators = new LinkedHashSet<>();

    @Convert(converter = JsonListConverter.class)
    @Column(columnDefinition = "text")
    private List<String> geographyRegions = new java.util.ArrayList<>();

    @Convert(converter = JsonMapConverter.class)
    @Column(columnDefinition = "text")
    private Map<String, Object> details = new java.util.LinkedHashMap<>();

    @Convert(converter = JsonMapConverter.class)
    @Column(columnDefinition = "text")
    private Map<String, Object> graphOverrides = new java.util.LinkedHashMap<>();

    @Column(nullable = true)
    private Double complexity = 0d;

    // description and metadata
    @Column(columnDefinition = "text")
    private String description;
    @Column(columnDefinition = "text")
    private String descriptionBefore;
    @Column(columnDefinition = "text")
    private String descriptionAfter;
    @Column(columnDefinition = "text")
    private String pilotPlan;
    private String status; // e.g. New, InProgress, Done, Cancelled, Frozen
    private String sendFlag; // "yes"/"no"
    private String level;
    private String secrecy;
    private String category;
    private String launchDate;
    private String approved; // "yes"/"no"
    private String geography;
    private String typeField;
    private String dateField;
    private String volume;
    private String abBaseVolume;
    private String kms;
    private String wt;
    private String ivr;
    private String smsTemplates;
    private String cmsArticleTitle;
    private String website;
    private String sellerTask;
    private String kcVid;
    private String kcDate;
    private String mbVid;
    private String mbDate;
    private String fdVid;
    private String fdDate;
    private String ldVid;
    private String ldDate;
    private String t2stTmVid;
    private String t2stTmDate;
    private String monthlyDigestMb;
    private String monthlyDigestT2stTm;
    private String kcVid2;
    private String kcDate3;
    private String cfVid;
    private String cfDate;
    private String mrRVid;
    private String mrRDate;
    private String srSvVid;
    private String srSvDate;
    private String mbVid4;
    private String mbDate5;
    private String t2stTmVid2;
    private String t2stTmDate2;
    private String fdVid6;
    private String fdDate7;
    private String ldVid8;
    private String ldDate9;
    private String fdVidExtra;
    private String ownerProject;
    private String curator;

    public Project() {}

    public Project(String name) {
        this.name = name;
        this.taskCount = 0;
        this.status = "New";
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getTaskCount() { return taskCount; }
    public void setTaskCount(int taskCount) { this.taskCount = taskCount; }

    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }
    public String getCodeName() { return codeName; }
    public void setCodeName(String codeName) { this.codeName = codeName; }
    public String getCustomer() { return customer; }
    public void setCustomer(String customer) { this.customer = customer; }
    public String getOrp() { return orp; }
    public void setOrp(String orp) { this.orp = orp; }
    public String getZniLink() { return zniLink; }
    public void setZniLink(String zniLink) { this.zniLink = zniLink; }
    public String getCuratorStatus() { return curatorStatus; }
    public void setCuratorStatus(String curatorStatus) { this.curatorStatus = curatorStatus; }
    public String getGraphName() { return graphName; }
    public void setGraphName(String graphName) { this.graphName = graphName; }
    public String getGraphTransferMode() { return graphTransferMode; }
    public void setGraphTransferMode(String graphTransferMode) { this.graphTransferMode = graphTransferMode; }
    public String getGraphInfoDate() { return graphInfoDate; }
    public void setGraphInfoDate(String graphInfoDate) { this.graphInfoDate = graphInfoDate; }
    public boolean isGraphDone() { return Boolean.TRUE.equals(graphDone); }
    public void setGraphDone(boolean graphDone) { this.graphDone = graphDone; }
    public Set<String> getCurators() { return curators; }
    public void setCurators(Set<String> curators) { this.curators = curators == null ? new LinkedHashSet<>() : new LinkedHashSet<>(curators); }
    public List<String> getGeographyRegions() { return geographyRegions; }
    public void setGeographyRegions(List<String> geographyRegions) { this.geographyRegions = geographyRegions == null ? new java.util.ArrayList<>() : geographyRegions; }
    public Map<String, Object> getDetails() { return details; }
    public void setDetails(Map<String, Object> details) { this.details = details == null ? new java.util.LinkedHashMap<>() : details; }
    public Map<String, Object> getGraphOverrides() { return graphOverrides; }
    public void setGraphOverrides(Map<String, Object> graphOverrides) { this.graphOverrides = graphOverrides == null ? new java.util.LinkedHashMap<>() : graphOverrides; }
    public double getComplexity() { return complexity == null ? 0d : complexity; }
    public void setComplexity(double complexity) { this.complexity = complexity; }
    public void normalizeLegacyDefaults() {
        if (graphDone == null) graphDone = false;
        if (complexity == null) complexity = 0d;
    }
    public boolean isTeamProject() { return teamProject; }
    public void setTeamProject(boolean teamProject) { this.teamProject = teamProject; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDescriptionBefore() { return descriptionBefore; }
    public void setDescriptionBefore(String descriptionBefore) { this.descriptionBefore = descriptionBefore; }
    public String getDescriptionAfter() { return descriptionAfter; }
    public void setDescriptionAfter(String descriptionAfter) { this.descriptionAfter = descriptionAfter; }
    public String getPilotPlan() { return pilotPlan; }
    public void setPilotPlan(String pilotPlan) { this.pilotPlan = pilotPlan; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSendFlag() { return sendFlag; }
    public void setSendFlag(String sendFlag) { this.sendFlag = sendFlag; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public String getSecrecy() { return secrecy; }
    public void setSecrecy(String secrecy) { this.secrecy = secrecy; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getLaunchDate() { return launchDate; }
    public void setLaunchDate(String launchDate) { this.launchDate = launchDate; }
    public String getApproved() { return approved; }
    public void setApproved(String approved) { this.approved = approved; }
    public String getGeography() { return geography; }
    public void setGeography(String geography) { this.geography = geography; }
    public String getTypeField() { return typeField; }
    public void setTypeField(String typeField) { this.typeField = typeField; }
    public String getDateField() { return dateField; }
    public void setDateField(String dateField) { this.dateField = dateField; }
    public String getVolume() { return volume; }
    public void setVolume(String volume) { this.volume = volume; }
    public String getAbBaseVolume() { return abBaseVolume; }
    public void setAbBaseVolume(String abBaseVolume) { this.abBaseVolume = abBaseVolume; }
    public String getKms() { return kms; }
    public void setKms(String kms) { this.kms = kms; }
    public String getWt() { return wt; }
    public void setWt(String wt) { this.wt = wt; }
    public String getIvr() { return ivr; }
    public void setIvr(String ivr) { this.ivr = ivr; }
    public String getSmsTemplates() { return smsTemplates; }
    public void setSmsTemplates(String smsTemplates) { this.smsTemplates = smsTemplates; }
    public String getCmsArticleTitle() { return cmsArticleTitle; }
    public void setCmsArticleTitle(String cmsArticleTitle) { this.cmsArticleTitle = cmsArticleTitle; }
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }
    public String getSellerTask() { return sellerTask; }
    public void setSellerTask(String sellerTask) { this.sellerTask = sellerTask; }
    public String getKcVid() { return kcVid; }
    public void setKcVid(String kcVid) { this.kcVid = kcVid; }
    public String getKcDate() { return kcDate; }
    public void setKcDate(String kcDate) { this.kcDate = kcDate; }
    public String getMbVid() { return mbVid; }
    public void setMbVid(String mbVid) { this.mbVid = mbVid; }
    public String getMbDate() { return mbDate; }
    public void setMbDate(String mbDate) { this.mbDate = mbDate; }
    public String getFdVid() { return fdVid; }
    public void setFdVid(String fdVid) { this.fdVid = fdVid; }
    public String getFdDate() { return fdDate; }
    public void setFdDate(String fdDate) { this.fdDate = fdDate; }
    public String getLdVid() { return ldVid; }
    public void setLdVid(String ldVid) { this.ldVid = ldVid; }
    public String getLdDate() { return ldDate; }
    public void setLdDate(String ldDate) { this.ldDate = ldDate; }
    public String getT2stTmVid() { return t2stTmVid; }
    public void setT2stTmVid(String t2stTmVid) { this.t2stTmVid = t2stTmVid; }
    public String getT2stTmDate() { return t2stTmDate; }
    public void setT2stTmDate(String t2stTmDate) { this.t2stTmDate = t2stTmDate; }
    public String getMonthlyDigestMb() { return monthlyDigestMb; }
    public void setMonthlyDigestMb(String monthlyDigestMb) { this.monthlyDigestMb = monthlyDigestMb; }
    public String getMonthlyDigestT2stTm() { return monthlyDigestT2stTm; }
    public void setMonthlyDigestT2stTm(String monthlyDigestT2stTm) { this.monthlyDigestT2stTm = monthlyDigestT2stTm; }
    public String getKcVid2() { return kcVid2; }
    public void setKcVid2(String kcVid2) { this.kcVid2 = kcVid2; }
    public String getKcDate3() { return kcDate3; }
    public void setKcDate3(String kcDate3) { this.kcDate3 = kcDate3; }
    public String getCfVid() { return cfVid; }
    public void setCfVid(String cfVid) { this.cfVid = cfVid; }
    public String getCfDate() { return cfDate; }
    public void setCfDate(String cfDate) { this.cfDate = cfDate; }
    public String getMrRVid() { return mrRVid; }
    public void setMrRVid(String mrRVid) { this.mrRVid = mrRVid; }
    public String getMrRDate() { return mrRDate; }
    public void setMrRDate(String mrRDate) { this.mrRDate = mrRDate; }
    public String getSrSvVid() { return srSvVid; }
    public void setSrSvVid(String srSvVid) { this.srSvVid = srSvVid; }
    public String getSrSvDate() { return srSvDate; }
    public void setSrSvDate(String srSvDate) { this.srSvDate = srSvDate; }
    public String getMbVid4() { return mbVid4; }
    public void setMbVid4(String mbVid4) { this.mbVid4 = mbVid4; }
    public String getMbDate5() { return mbDate5; }
    public void setMbDate5(String mbDate5) { this.mbDate5 = mbDate5; }
    public String getT2stTmVid2() { return t2stTmVid2; }
    public void setT2stTmVid2(String t2stTmVid2) { this.t2stTmVid2 = t2stTmVid2; }
    public String getT2stTmDate2() { return t2stTmDate2; }
    public void setT2stTmDate2(String t2stTmDate2) { this.t2stTmDate2 = t2stTmDate2; }
    public String getFdVid6() { return fdVid6; }
    public void setFdVid6(String fdVid6) { this.fdVid6 = fdVid6; }
    public String getFdDate7() { return fdDate7; }
    public void setFdDate7(String fdDate7) { this.fdDate7 = fdDate7; }
    public String getLdVid8() { return ldVid8; }
    public void setLdVid8(String ldVid8) { this.ldVid8 = ldVid8; }
    public String getLdDate9() { return ldDate9; }
    public void setLdDate9(String ldDate9) { this.ldDate9 = ldDate9; }
    public String getFdVidExtra() { return fdVidExtra; }
    public void setFdVidExtra(String fdVidExtra) { this.fdVidExtra = fdVidExtra; }
    public String getOwnerProject() { return ownerProject; }
    public void setOwnerProject(String ownerProject) { this.ownerProject = ownerProject; }
    public String getCurator() { return curator; }
    public void setCurator(String curator) { this.curator = curator; }
}
