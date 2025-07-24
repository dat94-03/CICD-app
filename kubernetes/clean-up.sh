#!/bin/bash

# Switch to the correct namespace
kubens biglab

# Delete deployments
kubectl delete -f frontend-deployment.yaml
kubectl delete -f backend-deployment.yaml

# Delete statefulset
kubectl delete -f mongodb-statefulset.yaml

# Delete persistent volume (PV) and storage class (SC) - BE CAREFUL with PVs, data will be lost
kubectl delete -f mongodb-pv.yaml
# Delete PVCs
kubectl delete pvc --all -n biglab

kubectl delete -f storage-class.yaml

# Delete configmaps
kubectl delete -f frontend-configmap.yaml
kubectl delete -f backend-configmap.yaml
kubectl delete -f mongodb-configmap.yaml

# Delete the namespace itself (this will delete everything within it)
# Use with caution, as it will remove all resources in 'biglab'
kubectl delete -f namespace.yaml

echo "Kubernetes resources cleaned up."